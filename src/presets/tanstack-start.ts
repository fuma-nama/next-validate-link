import * as path from "node:path";
import { glob } from "tinyglobby";
import type { ScanOptions, ScanResult } from "@/scan";
import { isDirExists } from "@/utils/fs";
import { populateToScanResult } from "./shared";

export async function scanURLs(options: ScanOptions = {}): Promise<ScanResult> {
  const ext = options.extensions ?? ["tsx", "ts", "jsx", "js"];
  const cwd = options.cwd ?? process.cwd();

  async function getFiles() {
    const suffix = ext.length > 0 ? `.{${ext.join(",")}}` : "";

    const routesFiles = await glob(`**/*${suffix}`, {
      cwd: (await isDirExists(path.join(cwd, "src/routes")))
        ? path.join(cwd, "src/routes")
        : path.join(cwd, "routes"),
    });

    const outFiles: string[] = [];

    for (const file of routesFiles) {
      let segments = file.replaceAll("[.]", "#").split(/[/\\.]/);
      // remove file extension
      segments.pop();

      // escaped dots -> dots
      segments = segments.map((segment) => segment.replaceAll("#", "."));
      if (segments.at(-1)?.startsWith("_")) continue;
      if (segments.at(-1) === "index") segments.pop();

      const outSegments: string[] = [];
      for (const name of segments) {
        if (name.length === 0) continue;

        if (name === "$") {
          outSegments.push(`[[..._splat]]`);
          continue;
        }

        if (name.startsWith("$")) {
          const paramName = name.slice(1);
          outSegments.push(`[${paramName}]`);
          continue;
        }

        outSegments.push(name);
      }

      outFiles.push(outSegments.join("/"));
    }

    return outFiles;
  }

  const result: ScanResult = { urls: new Map(), fallbackUrls: [] };
  const files = options.pages ?? (await getFiles());

  for (const file of files) {
    populateToScanResult(file.split("/"), options, result);
  }

  return result;
}
