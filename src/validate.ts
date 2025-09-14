import * as path from "node:path";
import type { ScanResult } from "@/scan";
import { isExternalUrlValid } from "./check-external-url";
import { type PathToUrl, readFileFromPath } from "./sample";
import { resolveUrl } from "./utils/url";
import {
  createMarkdownValidator,
  type MarkdownConfig,
} from "./validate/markdown";
import { isFileExists } from "./utils/fs";

export interface ValidateResult {
  file: string;

  /**]
   * @deprecated use `errors` instead
   */
  detected: DetectedError[];
  errors: ValidateError[];
}

export interface ValidateError {
  url: string;
  line: number;
  column: number;
  reason: ErrorReason | Error;
}

export type ErrorReason = "not-found" | "invalid-fragment" | "invalid-query";

export interface ResolutionConfig {
  /**
   * Base URL to resolve relative URLs
   */
  baseUrl?: string;

  /**
   * Base directory to resolve relative file paths
   */
  baseDir?: string;

  /**
   * Generate URL from file paths, used for relative file path detection.
   *
   * Default to searching in input files.
   */
  pathToUrl?: PathToUrl;
}

export interface DetectorConfig {
  /**
   * Available URLs (including hashes and query parameters)
   */
  scanned: ScanResult;

  /**
   * don't validate the fragment/hash of URLs
   *
   * @defaultValue false
   */
  ignoreFragment?: boolean;

  /**
   * don't validate the query of URLs
   *
   * @defaultValue false
   */
  ignoreQuery?: boolean;

  /**
   * Check external urls
   *
   * @defaultValue false
   */
  checkExternal?: boolean;

  /**
   * Check relative paths (e.g. `[My File](./my-file.md)`)
   *
   * - `exists`: ensure the file exists.
   * - `as-url`: resolve & check the public URL of referenced file, requires one of these to be defined:
   *    - `pathToUrl` option.
   *    - `file.url` in input file objects.
   * - `false` (default): ignore.
   */
  checkRelativePaths?: "exists" | "as-url" | false;

  /**
   * Check relative URLs (e.g. `[My File](./my-page)`)
   *
   * - `true` (default): resolve & check the relative URL, requires one of these to be defined:
   *   - `file.url` in input file objects.
   *   - `pathToUrl` option.
   *   - `baseUrl` option.
   * - `false`: ignore.
   */
  checkRelativeUrls?: boolean;

  /**
   * Allowed hrefs, can be:
   * - a list of hrefs
   * - a function that returns `true` for allowed href
   */
  whitelist?: string[] | ((url: string) => boolean);

  /**
   * Determinate the type of pathname
   */
  determinatePathname?: (pathname: string) => Awaitable<PathnameType>;
}

export interface ValidateConfig extends ResolutionConfig, DetectorConfig {
  markdown?: MarkdownConfig;
}

type PathnameType = "url" | "relative-file-path" | "relative-url";

type Awaitable<T> = T | Promise<T>;

export interface FileObject {
  path: string;
  content: string;

  data?: object;

  /**
   * URL of page, required for relative url detection
   */
  url?: string;
}

const mdExtensions = [".md", ".mdx"];
const supportedExtensions = mdExtensions;

/**
 * Validate markdown files
 *
 * @param files - file paths or file objects
 * @param config - configurations
 */
export async function validateFiles(
  files: (string | FileObject)[],
  config: ValidateConfig,
): Promise<ValidateResult[]> {
  const detector = createDetector(config);
  const markdownValidator = createMarkdownValidator(
    config.markdown ?? {},
    detector,
  );

  const normalized = await Promise.all(
    files.map(async (file) =>
      typeof file === "string"
        ? await readFileFromPath(file, config.pathToUrl)
        : file,
    ),
  );
  const defaultPathToUrl: PathToUrl = (path) => {
    for (const file of normalized) {
      if (file.path === path && file.url) return file.url;
    }
  };

  async function run(file: FileObject): Promise<ValidateResult> {
    const resolution: ResolutionConfig = {
      baseUrl: file.url
        ? file.url.split("/").slice(0, -1).join("/")
        : config.baseUrl,
      baseDir: path.dirname(file.path),
      pathToUrl: config.pathToUrl ?? defaultPathToUrl,
    };
    const ext = path.extname(file.path);

    let errors: ValidateError[] = [];
    if (mdExtensions.includes(ext)) {
      errors = await markdownValidator.validate(file, resolution);
    } else {
      console.warn(
        `format unsupported: ${ext}, supported: ${supportedExtensions.join(
          ", ",
        )}`,
      );
    }

    return {
      file: file.path,
      errors,
      get detected() {
        return errors.map(generateLegacyError);
      },
    };
  }

  return (await Promise.all(normalized.map(run))).filter(
    (err) => err.errors.length > 0,
  );
}

export interface Detector {
  detect: (
    href: string,
    resolution: ResolutionConfig,
  ) => Promise<{ type: "error"; reason: ErrorReason } | undefined>;
}

function createDetector(config: DetectorConfig): Detector {
  const PathnameRegex = /^([^?#]*)(\?[^#]*)?(#.*)?$/;
  const {
    checkRelativePaths = false,
    checkExternal = false,
    ignoreFragment = false,
    ignoreQuery = false,
    checkRelativeUrls = true,
    whitelist,
    determinatePathname = (pathname) => {
      if (!pathname.startsWith(".")) return "url";

      if (pathname.endsWith(".md") || pathname.endsWith(".mdx")) {
        return "relative-file-path";
      }

      return "relative-url";
    },
  } = config;

  function parsePathname(pathname: string) {
    const match = PathnameRegex.exec(pathname);
    if (!match) return { pathname };

    return {
      pathname: match[1],
      query: match[2]?.slice(1),
      fragment: match[3]?.slice(1),
    };
  }

  return {
    async detect(href, { baseDir, baseUrl, pathToUrl }) {
      if (href.startsWith("mailto:")) return;

      if (href.match(/https?:\/\//)) {
        return !checkExternal || (await isExternalUrlValid(href))
          ? undefined
          : { type: "error", reason: "not-found" };
      }

      if (Array.isArray(whitelist) && whitelist.includes(href)) return;
      if (typeof whitelist === "function" && whitelist(href)) return;

      let { pathname, query, fragment } = parsePathname(href);

      if (pathname.length === 0 || pathname === "./") return;
      const type = await determinatePathname(pathname);

      if (type === "relative-url") {
        if (!checkRelativeUrls) return;
        if (!baseUrl)
          throw new Error(
            `relative URL ${pathname} detected, but 'baseUrl' option is missing.`,
          );

        pathname = resolveUrl(baseUrl, pathname);
      }

      if (type === "relative-file-path") {
        const filePath = path.join(baseDir ?? "", pathname);

        if (!checkRelativePaths) return;

        if (checkRelativePaths === "exists") {
          return (await isFileExists(filePath))
            ? undefined
            : { type: "error", reason: "not-found" };
        }

        if (checkRelativePaths === "as-url") {
          if (!pathToUrl)
            throw new Error(
              `'checkRelativePaths: as-url' is set, but 'pathToUrl' option is missing.`,
            );

          const asUrl = pathToUrl(filePath);
          if (!asUrl) return;
          pathname = asUrl;
        }
      }

      if (!pathname.startsWith("/")) pathname = `/${pathname}`;
      let meta = config.scanned.urls.get(pathname);
      if (!meta) {
        meta = config.scanned.fallbackUrls.find((fallbackUrl) => {
          return fallbackUrl.url.test(pathname);
        })?.meta;
      }

      if (!meta)
        return {
          type: "error",
          reason: "not-found",
        };

      if (
        fragment &&
        !ignoreFragment &&
        meta.hashes &&
        !meta.hashes.includes(fragment)
      ) {
        return { type: "error", reason: "invalid-fragment" };
      }

      if (
        query &&
        !ignoreQuery &&
        meta.queries &&
        !meta.queries.some(
          (item) => new URLSearchParams(item).toString() === query,
        )
      ) {
        return { type: "error", reason: "invalid-query" };
      }
    },
  };
}

export type DetectedError = [
  url: string,
  line: number,
  column: number,
  reason: ErrorReason | Error,
];

function generateLegacyError(v: ValidateError): DetectedError {
  return [v.url, v.line, v.column, v.reason];
}
