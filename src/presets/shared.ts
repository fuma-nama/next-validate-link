import type {
  PopulateParams,
  ScanOptions,
  ScanResult,
  UrlMeta,
} from '@/scan';

const defaultPopulate: PopulateParams[string] = [{}];

const OPTIONAL_CATCH_ALL = /^\[\[\.\.\.(.+)\]\]$/;
const CALCH_ALL = /^\[\.\.\.(.+)\]$/;

export function populate(
  segments: string[],
  options: ScanOptions,
): { url: string | RegExp; meta?: UrlMeta }[] {
  const current: string[] = [];
  const paramIndexes = new Map<number, 'required' | 'optional'>();

  for (let i = 0; i < segments.length; i++) {
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
    const meta =
      options.meta?.[segments.length === 0 ? '/' : segments.join('/')];

    return [
      {
        url: `/${current.join('/')}`,
        meta,
      },
    ];
  }

  const out: { url: string | RegExp; meta?: UrlMeta }[] = [];

  let params: PopulateParams[string] | undefined;
  if (options.populate) {
    params = options.populate['/'];
    const searchPath = [...segments];

    while (!params && searchPath.length > 0) {
      params = options.populate[searchPath.join('/')];
      searchPath.pop();
    }
  }

  for (const param of params ?? defaultPopulate) {
    let clone = [...current];

    if (
      paramIndexes.size > 1 &&
      (Array.isArray(param.value) || typeof param.value === 'string')
    ) {
      console.warn(
        `path ${segments.join('/')} requires multiple params, an object value for populate is expected.`,
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

export function populateToScanResult(
  segments: string[],
  options: ScanOptions,
  result: ScanResult,
) {
  const out = populate(segments, options);

  for (const entry of out) {
    if (typeof entry.url === 'string') {
      result.urls.set(entry.url, entry.meta ?? {});
      continue;
    }

    result.fallbackUrls.push({
      url: entry.url,
      meta: entry.meta ?? {},
    });
  }
}
