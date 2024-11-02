import path from 'node:path';
import fs from 'node:fs/promises';

export async function readFileFromPath(file: string) {
  const content = await fs
    .readFile(path.resolve(file))
    .then((res) => res.toString());

  return {
    path: file,
    content: content,
  };
}
