import * as path from "node:path";
import type { ScanOptions, ScanResult } from "@/scan";
import { isDirExists } from "@/utils/fs";
import { populateToScanResult } from "./shared";
import { glob } from "tinyglobby";

export async function scanURLs(options: ScanOptions = {}): Promise<ScanResult> {
  const ext = options.extensions ?? ["tsx", "ts", "jsx", "js"];
  const cwd = options.cwd ?? process.cwd();

  async function getFiles() {
    const suffix = ext.length > 0 ? `.{${ext.join(",")}}` : "";
    const pagesFiles = await glob(`**/*${suffix}`, {
      cwd: (await isDirExists(path.join(cwd, "src/pages")))
        ? path.join(cwd, "src/pages")
        : path.join(cwd, "pages"),
    });

    const outFiles: string[] = [];

    for (const file of pagesFiles) {
      const parsed = path.parse(file);
      if (parsed.name.startsWith("_")) continue;

      const segments = parsed.dir.split(path.sep);
      if (parsed.name !== "index") segments.push(parsed.name);

      const outSegments: string[] = [];
      for (const name of segments) {
        // [...param] is optional in Waku
        if (name.startsWith("[...") && name.endsWith("]")) {
          outSegments.push(`[${name}]`);
        } else if (name.length > 0) {
          outSegments.push(name);
        }
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
