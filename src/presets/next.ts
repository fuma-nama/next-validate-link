import * as path from "node:path";
import { glob } from "tinyglobby";
import type { ScanOptions, ScanResult } from "@/scan";
import { isDirExists } from "@/utils/fs";
import { populateToScanResult } from "./shared";

export async function scanURLs(options: ScanOptions = {}): Promise<ScanResult> {
  const ext = options.extensions ?? ["js", "jsx", "tsx", "md", "mdx"];
  const cwd = options.cwd ?? process.cwd();

  async function getFiles() {
    const suffix = ext.length > 0 ? `.{${ext.join(",")}}` : "";

    const appFiles = await glob(`**/page${suffix}`, {
      cwd: (await isDirExists(path.join(cwd, "src/app")))
        ? path.join(cwd, "src/app")
        : path.join(cwd, "app"),
    });

    const pagesFiles = await glob(`**/*${suffix}`, {
      cwd: (await isDirExists(path.join(cwd, "src/pages")))
        ? path.join(cwd, "src/pages")
        : path.join(cwd, "pages"),
    });

    if (options.pages) appFiles.push(...options.pages);

    return [
      ...appFiles.map((file) => {
        const dir = path.dirname(file);

        return dir === "." ? "" : dir;
      }),
      ...pagesFiles.map((file) => {
        const parsed = path.parse(file);
        if (parsed.name === "index") return parsed.dir;

        return path.join(parsed.dir, parsed.name);
      }),
    ];
  }

  // compatibility
  if (options.meta)
    for (const key of Object.keys(options.meta)) {
      if (!key.endsWith("page.tsx")) continue;
      let newKey = path.dirname(key);
      if (newKey === ".") newKey = "/";
      options.meta[newKey] = options.meta[key];
      delete options.meta[key];
    }

  const result: ScanResult = { urls: new Map(), fallbackUrls: [] };
  const files = await getFiles();

  for (const file of files) {
    populateToScanResult(
      file.length === 0 ? [] : file.split(path.sep),
      options,
      result,
    );
  }

  return result;
}
