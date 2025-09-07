import { stat } from "node:fs/promises";

export function isDirExists(dir: string): Promise<boolean> {
  return stat(dir)
    .then((res) => res.isDirectory())
    .catch(() => false);
}
