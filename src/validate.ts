import * as path from "node:path";
import type { ScanResult } from "@/scan";
import { isExternalUrlValid } from "./check-external-url";
import { type PathToUrl, readFileFromPath } from "./sample";
import { resolveUrl } from "./utils/url";
import { type MarkdownConfig, validateMarkdown } from "./validate/markdown";

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

export interface ValidateConfig {
  /**
   * Base URL to resolve relative URLs
   */
  baseUrl?: string;

  /**
   * Base directory to resolve relative file paths
   */
  baseDir?: string;

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
   * Generate url for file paths.
   *
   * Required for relative url/file path detection.
   */
  pathToUrl?: PathToUrl;

  /**
   * Allowed hrefs, can be:
   * - a list of hrefs
   * - a function that returns `true` for allowed href
   */
  whitelist?: string[] | ((url: string) => boolean);

  /**
   * Determinate the type of pathname
   */
  determinatePathname?: (
    pathname: string,
    config: ValidateConfig
  ) => Awaitable<PathnameType>;

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

/**
 * Validate markdown files
 *
 * @param files - file paths or file objects
 * @param config - configurations
 */
export async function validateFiles(
  files: (string | FileObject)[],
  config: ValidateConfig
): Promise<ValidateResult[]> {
  const mdExtensions = [".md", ".mdx"];
  const supportedExtensions = mdExtensions;

  async function run(file: string | FileObject): Promise<ValidateResult> {
    const resolved =
      typeof file === "string"
        ? await readFileFromPath(file, config.pathToUrl)
        : file;

    const detector = createDetector({
      ...config,
      baseUrl: resolved.url
        ? resolved.url.split("/").slice(0, -1).join("/")
        : config.baseUrl,
      baseDir: path.dirname(resolved.path),
    });
    const ext = path.extname(resolved.path);

    let errors: ValidateError[] = [];
    if (mdExtensions.includes(ext)) {
      errors = await validateMarkdown(
        resolved,
        detector,
        config.markdown ?? {}
      );
    } else {
      console.warn(
        `format unsupported: ${ext}, supported: ${supportedExtensions.join(
          ", "
        )}`
      );
    }

    return {
      file: resolved.path,
      errors,
      get detected() {
        return errors.map(generateLegacyError);
      },
    };
  }

  return (await Promise.all(files.map(run))).filter(
    (err) => err.errors.length > 0
  );
}

export interface Detector {
  detect: (
    href: string
  ) => Promise<{ type: "error"; reason: ErrorReason } | undefined>;
}

function createDetector(config: ValidateConfig): Detector {
  const determinatePathname =
    config.determinatePathname ?? defaultDeterminatePathname;
  const PathnameRegex = /^([^?#]*)(\?[^#]*)?(#.*)?$/;

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
    async detect(href) {
      if (href.startsWith("mailto:")) return;

      if (href.match(/https?:\/\//)) {
        if (config.checkExternal && !(await isExternalUrlValid(href))) {
          return { type: "error", reason: "not-found" };
        }

        return;
      }

      if (Array.isArray(config.whitelist) && config.whitelist.includes(href))
        return;
      if (typeof config.whitelist === "function" && config.whitelist(href))
        return;

      let { pathname, query, fragment } = parsePathname(href);

      if (pathname.length === 0 || pathname === "./") return;
      const type = await determinatePathname(pathname, config);

      if (type === "relative-url" && config.baseUrl) {
        pathname = resolveUrl(config.baseUrl, pathname);
      }

      if (type === "relative-file-path" && config.pathToUrl) {
        const filePath = path.join(config.baseDir ?? "", pathname);
        pathname = config.pathToUrl(filePath);
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

      const validFragment =
        config.ignoreFragment ||
        !fragment ||
        !meta.hashes ||
        meta.hashes.includes(fragment);

      if (!validFragment) {
        return { type: "error", reason: "invalid-fragment" };
      }

      const validQuery =
        config.ignoreQuery ||
        !query ||
        !meta.queries ||
        meta.queries.some(
          (item) => new URLSearchParams(item).toString() === query
        );

      if (!validQuery) {
        return { type: "error", reason: "invalid-query" };
      }
    },
  };
}

async function defaultDeterminatePathname(
  pathname: string,
  config: ValidateConfig
): Promise<PathnameType> {
  if (!pathname.startsWith(".")) return "url";

  if (
    config.pathToUrl &&
    (pathname.endsWith(".md") || pathname.endsWith(".mdx"))
  ) {
    return "relative-file-path";
  }

  return "relative-url";
}

export type DetectedError = [
  url: string,
  line: number,
  column: number,
  reason: ErrorReason | Error
];

function generateLegacyError(v: ValidateError): DetectedError {
  return [v.url, v.line, v.column, v.reason];
}
