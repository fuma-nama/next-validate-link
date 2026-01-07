import * as fs from "node:fs/promises";

export function isDirExists(dir: string): Promise<boolean> {
  return fs
    .stat(dir)
    .then((res) => res.isDirectory())
    .catch(() => false);
}

export async function isFileExists(file: string) {
  try {
    await fs.access(file);
    return true;
  } catch (_error) {
    return false;
  }
}
