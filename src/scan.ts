import * as Next from './presets/next';
import * as Astro from './presets/astro';
import * as Nuxt from './presets/nuxt';

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

export async function scanURLs({
  preset,
  ...options
}: ScanOptions & {
  /**
   * @default next
   */
  preset?: 'next' | 'astro' | 'nuxt';
} = {}): Promise<ScanResult> {
  if (preset === 'astro') return Astro.scanURLs(options);
  if (preset === 'nuxt') return Nuxt.scanURLs(options);

  return Next.scanURLs(options);
}
