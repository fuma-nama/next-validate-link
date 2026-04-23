import type { RouteConfig, RouteConfigEntry } from "@react-router/dev/routes";
import type { ScanOptions, ScanResult } from "@/scan";
import { populateToScanResult } from "./shared";

export interface ReactRouterScanOptions extends ScanOptions {
  preset: "react-router";
  routerConfig: RouteConfig;
}

export async function scanURLs(
  options: ReactRouterScanOptions,
): Promise<ScanResult> {
  const { routerConfig } = options;

  async function getFiles() {
    if (options.pages) return options.pages;
    const files: string[] = [];
    const resolved = await routerConfig;

    for (const route of resolved) {
      resolveEntryFiles(files, route);
    }

    return files;
  }

  const result: ScanResult = { urls: new Map(), fallbackUrls: [] };

  for (const file of await getFiles()) {
    populateToScanResult(file.split("/"), options, result);
  }

  return result;
}

function resolveEntryFiles(
  outputFiles: string[],
  entry: RouteConfigEntry,
  parent?: string[],
) {
  const fullPath = entry.path?.split("/") ?? [];
  if (parent) fullPath.unshift(...parent);

  if (entry.path) {
    const combinations: string[][] = [[]];
    function pushSegment(item: string, newCombination: boolean) {
      if (newCombination) {
        const next = combinations.map((combination) => [...combination, item]);

        combinations.push(...next);
      } else {
        for (const combination of combinations) {
          combination.push(item);
        }
      }
    }

    for (let i = 0; i < fullPath.length; i++) {
      let name = fullPath[i];
      if (name.length === 0) continue;

      const isOptional = name.endsWith("?");
      if (isOptional) {
        name = name.slice(0, -1);
      }

      // param
      if (name.startsWith(":")) {
        const paramName = name.slice(1);
        pushSegment(`[${paramName}]`, isOptional);
        continue;
      }

      // splat
      if (name === "*") {
        pushSegment(`[[...splat]]`, isOptional);
        continue;
      }

      pushSegment(name, isOptional);
    }

    for (const combination of combinations) {
      outputFiles.push(combination.join("/"));
    }
  }

  if (entry.children) {
    for (const child of entry.children) {
      resolveEntryFiles(outputFiles, child, fullPath);
    }
  }
}
