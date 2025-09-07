import type { PopulateParams, ScanOptions, ScanResult, UrlMeta } from "@/scan";

const defaultPopulate: PopulateParams[string] = [{}];

const OPTIONAL_CATCH_ALL = /^\[\[\.\.\.(.+)\]\]$/;
const CALCH_ALL = /^\[\.\.\.(.+)\]$/;

function parseSegments(segments: string[]): {
  path: string[];
  params: ("required" | "optional" | null)[];
} {
  const path: string[] = [];
  const params: ("required" | "optional" | null)[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    // route groups
    if (segment.startsWith("(") && segment.endsWith(")")) continue;
    let match = OPTIONAL_CATCH_ALL.exec(segment);

    if (match) {
      params.push("optional");
      path.push(match[1]);
      continue;
    }

    match = CALCH_ALL.exec(segment);
    if (match) {
      params.push("required");
      path.push(match[1]);
      continue;
    }

    if (segment.startsWith("[") && segment.endsWith("]")) {
      params.push("required");
      path.push(segment.slice(1, -1));
      continue;
    }

    params.push(null);
    path.push(segment);
  }

  return { path, params };
}

interface PopulatedRoute {
  url: string | RegExp;
  meta?: UrlMeta;
}

export function populate(
  segments: string[],
  options: ScanOptions,
): PopulatedRoute[] {
  const parsed = parseSegments(segments);
  const countParams = parsed.params.filter((param) => param !== null).length;

  // static
  if (countParams === 0) {
    const meta =
      options.meta?.[segments.length === 0 ? "/" : segments.join("/")];

    return [
      {
        url: `/${parsed.path.join("/")}`,
        meta,
      },
    ];
  }

  const out: PopulatedRoute[] = [];

  let params: PopulateParams[string] | undefined;
  if (options.populate) {
    params = options.populate["/"];
    const searchPath = [...segments];

    while (!params && searchPath.length > 0) {
      params = options.populate[searchPath.join("/")];
      searchPath.pop();
    }
  }

  params ??= defaultPopulate;

  for (const param of params) {
    // filled url
    let url = [...parsed.path];

    if (
      countParams > 1 &&
      (Array.isArray(param.value) || typeof param.value === "string")
    ) {
      console.warn(
        `path ${segments.join("/")} requires multiple params, an object value for populate is expected.`,
      );
    }

    let isFallback = false;
    for (let i = 0; i < parsed.params.length; i++) {
      if (parsed.params[i] === null) continue;

      const name = parsed.path[i];
      let value: string | string[] | undefined;

      if (Array.isArray(param.value) || typeof param.value === "string") {
        value = param.value;
      } else if (param.value && name in param.value) {
        value = param.value[name];
      }

      if (value) {
        url[i] = typeof value === "string" ? value : value.join("/");
        continue;
      }

      if (parsed.params[i] === "optional") {
        if (i !== parsed.params.length - 1) {
          throw new Error("Invalid position of optional catch-all");
        }

        // without param (optional case)
        out.push({
          url: `/${url.slice(0, -1).join("/")}`,
          meta: param,
        });
      }

      url[i] = "(.+)";
      isFallback = true;
    }

    url = url.filter(Boolean);

    out.push({
      url: isFallback
        ? new RegExp(`^\\/${url.join("\\/")}$`)
        : `/${url.join("/")}`,
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
    if (typeof entry.url === "string") {
      result.urls.set(entry.url, entry.meta ?? {});
      continue;
    }

    result.fallbackUrls.push({
      url: entry.url,
      meta: entry.meta ?? {},
    });
  }
}
