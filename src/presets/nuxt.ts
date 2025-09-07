import * as path from "node:path";
import fg from "fast-glob";
import type { ScanOptions, ScanResult } from "@/scan";
import { isDirExists } from "@/utils/fs";
import { populateToScanResult } from "./shared";

export async function scanURLs(options: ScanOptions = {}): Promise<ScanResult> {
  const ext = options.extensions ?? ["vue", "md", "mdx"];
  const cwd = options.cwd ?? process.cwd();

  async function getFiles() {
    const suffix = ext.length > 0 ? `.{${ext.join(",")}}` : "";

    const pagesFiles = await fg(`**/*${suffix}`, {
      cwd: (await isDirExists(path.join(cwd, "src/pages")))
        ? path.join(cwd, "src/pages")
        : path.join(cwd, "pages"),
    });

    return pagesFiles.map((file) => {
      const parsed = path.parse(file);
      if (parsed.name === "index") return parsed.dir;

      return path.join(parsed.dir, parsed.name);
    });
  }

  const result: ScanResult = { urls: new Map(), fallbackUrls: [] };
  const files = options.pages ?? (await getFiles());

  for (const file of files) {
    populateToScanResult(file.split(path.sep), options, result);
  }

  return result;
}
