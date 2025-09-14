import * as Astro from "./presets/astro";
import * as Next from "./presets/next";
import * as Nuxt from "./presets/nuxt";
import * as ReactRouter from "./presets/react-router";
import * as Waku from "./presets/waku";

export type PopulateParams = Record<
  string,
  {
    value?: string[] | string | Record<string, string[] | string>;
    hashes?: string[];
    queries?: Record<string, string>[];
  }[]
>;

export interface ScanOptions {
  /**
   * path of pages (e.g. `/docs/page.tsx`)
   *
   * App Router format only
   **/
  pages?: string[];
  cwd?: string;

  populate?: PopulateParams;
  meta?: Record<string, UrlMeta>;
  extensions?: string[];
}

export type ScanPresetOptions =
  | (ScanOptions & {
      /**
       * @default next
       */
      preset?: "next" | "astro" | "nuxt" | "waku";
    })
  | ReactRouter.ReactRouterScanOptions;

export interface ScanResult {
  urls: Map<string, UrlMeta>;

  fallbackUrls: {
    url: RegExp;
    meta: UrlMeta;
  }[];
}

export interface UrlMeta {
  hashes?: string[];
  queries?: Record<string, string>[];
}

export async function scanURLs(
  options: ScanPresetOptions = {},
): Promise<ScanResult> {
  switch (options.preset) {
    case "astro":
      return Astro.scanURLs(options);
    case "nuxt":
      return Nuxt.scanURLs(options);
    case "react-router":
      return ReactRouter.scanURLs(options);
    case "waku":
      return Waku.scanURLs(options);
    default:
      return Next.scanURLs(options);
  }
}
