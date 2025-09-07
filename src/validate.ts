import * as path from "node:path";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import type { ScanResult } from "@/scan";
import { checkExternalUrl } from "./check-external-url";
import { type PathToUrl, readFileFromPath } from "./sample";
import { resolveUrl } from "./utils/url";

const processor = remark().use(remarkGfm);

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

export type ValidateConfig = {
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
    config: ValidateConfig,
  ) => Awaitable<PathnameType>;
};

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
  config: ValidateConfig,
): Promise<ValidateResult[]> {
  const mdExtensions = [".md", ".mdx"];

  async function run(file: string | FileObject): Promise<ValidateResult> {
    const resolved =
      typeof file === "string"
        ? await readFileFromPath(file, config.pathToUrl)
        : file;

    if (!mdExtensions.includes(path.extname(resolved.path))) {
      console.warn(
        `format unsupported: ${resolved.path}, supported: ${mdExtensions.join(", ")}`,
      );

      return { file: resolved.path, detected: [], errors: [] };
    }

    const errors = await validateMarkdown(resolved.content, {
      ...config,
      baseUrl: resolved.url
        ? resolved.url.split("/").slice(0, -1).join("/")
        : config.baseUrl,
      baseDir: path.dirname(resolved.path),
    });

    return {
      file: resolved.path,
      errors,
      get detected() {
        return errors.map(generateLegacyError);
      },
    };
  }

  return (await Promise.all(files.map(run))).filter(
    (err) => err.errors.length > 0,
  );
}

export async function validateMarkdown(
  content: string,
  config: ValidateConfig,
) {
  const tree = processor.parse({ value: content });
  const errors: ValidateError[] = [];
  const tasks: Promise<void>[] = [];

  visit(tree, "link", (node) => {
    // ignore generated nodes
    if (!node.position) return;
    const pos = node.position;

    tasks.push(
      detect(node.url, config)
        .then((err) => {
          if (!err) return;

          errors.push({
            url: node.url,
            line: pos.start.line,
            column: pos.start.column,
            reason: err,
          });
        })
        .catch((err: Error) => {
          errors.push({
            url: node.url,
            line: pos.start.line,
            column: pos.start.column,
            reason: err,
          });
        }),
    );
  });

  await Promise.all(tasks);

  return errors;
}

export async function detect(
  href: string,
  config: ValidateConfig,
): Promise<ErrorReason | undefined> {
  const determinatePathname =
    config.determinatePathname ?? defaultDeterminatePathname;
  if (href.startsWith("mailto:")) return;

  if (href.match(/https?:\/\//)) {
    if (config.checkExternal) {
      return await checkExternalUrl(href);
    }

    return;
  }

  if (config.whitelist) {
    if (Array.isArray(config.whitelist) && config.whitelist.includes(href))
      return;
    if (typeof config.whitelist === "function" && config.whitelist(href))
      return;
  }

  const [pathnameWithQuery, fragment] = href.split("#", 2);
  let [pathname, query] = pathnameWithQuery.split("?", 2);

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

  if (!meta) return "not-found";

  const validFragment =
    config.ignoreFragment ||
    !fragment ||
    !meta.hashes ||
    meta.hashes.includes(fragment);

  if (!validFragment) {
    return "invalid-fragment";
  }

  const validQuery =
    config.ignoreQuery ||
    !query ||
    !meta.queries ||
    meta.queries.some((item) => new URLSearchParams(item).toString() === query);

  if (!validQuery) {
    return "invalid-query";
  }
}

async function defaultDeterminatePathname(
  pathname: string,
  config: ValidateConfig,
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
  reason: ErrorReason | Error,
];

function generateLegacyError(v: ValidateError): DetectedError {
  return [v.url, v.line, v.column, v.reason];
}
