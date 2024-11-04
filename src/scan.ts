import fg from 'fast-glob';
import * as path from 'node:path';
import { stat } from 'node:fs/promises';

export type PopulateParams = Record<
  string,
  {
    value?: string[] | string | Record<string, string[] | string>;
    hashes?: string[];
    queries?: Record<string, string>[];
  }[]
>;

export type ScanOptions = {
  /**
   * path of pages (e.g. `/docs/page.tsx`)
   *
   * App Router format only
   **/
  pages?: string[];
  cwd?: string;

  populate?: PopulateParams;
  meta?: Record<string, UrlMeta>;
};

export type ScanResult = {
  urls: Map<string, UrlMeta>;

  fallbackUrls: {
    url: RegExp;
    meta: UrlMeta;
  }[];
};

type UrlMeta = {
  hashes?: string[];
  queries?: Record<string, string>[];
};

const defaultMeta = {};
const defaultPopulate: PopulateParams[string] = [{}];

function isDirExists(dir: string): Promise<boolean> {
  return stat(dir)
    .then((res) => res.isDirectory())
    .catch(() => false);
}

export async function scanURLs(options: ScanOptions = {}): Promise<ScanResult> {
  async function getFiles() {
    const cwd = options.cwd ?? process.cwd();

    const appFiles = await fg('**/page.{js,jsx,tsx}', {
      cwd: (await isDirExists(path.join(cwd, 'src/app')))
        ? path.join(cwd, 'src/app')
        : path.join(cwd, 'app'),
    });

    const pagesFiles = await fg('**/*.{js,jsx,tsx}', {
      cwd: (await isDirExists(path.join(cwd, 'src/pages')))
        ? path.join(cwd, 'src/pages')
        : path.join(cwd, 'pages'),
    });

    return [
      ...appFiles,
      ...pagesFiles.map((file) => {
        const parsed = path.parse(file);
        if (parsed.name === 'index') return file;

        return path.join(parsed.dir, parsed.name, 'page.tsx');
      }),
    ];
  }

  const result: ScanResult = { urls: new Map(), fallbackUrls: [] };
  const files = options.pages ?? (await getFiles());

  files.forEach((file) => {
    const segments = file.split(path.sep);
    const out = populate(segments, options);

    out.forEach((entry) => {
      if (typeof entry.url === 'string') {
        result.urls.set(entry.url, entry.meta ?? defaultMeta);
      } else {
        result.fallbackUrls.push({
          url: entry.url,
          meta: entry.meta ?? defaultMeta,
        });
      }
    });
  });

  return result;
}

const OPTIONAL_CATCH_ALL = /^\[\[\.\.\.(.+)\]\]$/;
const CALCH_ALL = /^\[\.\.\.(.+)\]$/;

function populate(
  segments: string[],
  options: ScanOptions,
): { url: string | RegExp; meta?: UrlMeta }[] {
  const current: string[] = [];
  const paramIndexes = new Map<number, 'required' | 'optional'>();

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];

    // route groups
    if (segment.startsWith('(') && segment.endsWith(')')) continue;
    if (segment.startsWith('[') && segment.endsWith(']')) {
      let match = OPTIONAL_CATCH_ALL.exec(segment);

      if (match) {
        paramIndexes.set(i, 'optional');
        current.push(match[1]);
        continue;
      }

      match = CALCH_ALL.exec(segment);
      if (match) {
        paramIndexes.set(i, 'required');
        current.push(match[1]);
        continue;
      }

      paramIndexes.set(i, 'required');
      current.push(segment.slice(1, -1));
      continue;
    }

    current.push(segment);
  }
  // static
  if (paramIndexes.size === 0) {
    return [
      {
        url: `/${current.join('/')}`,
        meta: options.meta?.[segments.join('/')],
      },
    ];
  }

  const out: { url: string | RegExp; meta?: UrlMeta }[] = [];

  const searchPath = segments;
  let populate: PopulateParams[string] | undefined;
  while (!populate && searchPath.length > 0) {
    populate = options.populate?.[searchPath.join('/')];
    searchPath.pop();
  }

  for (const param of populate ?? defaultPopulate) {
    let clone = [...current];

    if (
      paramIndexes.size > 1 &&
      (Array.isArray(param.value) || typeof param.value === 'string')
    ) {
      console.warn(
        `path ${searchPath.join('/')} requires multiple params, an object value for populate is expected.`,
      );
    }

    let isFallback = false;
    for (const [index, type] of paramIndexes.entries()) {
      const name = current[index];
      let value: string | string[] | undefined;

      if (Array.isArray(param.value) || typeof param.value === 'string') {
        value = param.value;
      } else if (param.value && name in param.value) {
        value = param.value[name];
      }

      if (value) {
        clone[index] = typeof value === 'string' ? value : value.join('/');
        continue;
      }

      if (type === 'optional') {
        if (index !== current.length - 1)
          throw new Error('Invalid position of optional catch-all');

        // without param (optional case)
        out.push({
          url: `/${clone.slice(0, -1).join('/')}`,
          meta: param,
        });
      }

      clone[index] = '(.+)';
      isFallback = true;
    }

    clone = clone.filter(Boolean);

    out.push({
      url: isFallback
        ? new RegExp(`^\\/${clone.join('\\/')}$`)
        : `/${clone.join('/')}`,
      meta: param,
    });
  }

  return out;
}
