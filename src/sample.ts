import path from 'node:path';
import fs from 'node:fs/promises';
import FastGlob, { type Pattern } from 'fast-glob';
import type { FileObject } from './validate';
import matter from 'gray-matter';

export type PathToUrl = (path: string) => string;

export async function readFileFromPath(
  file: string,
  pathToUrl?: PathToUrl,
): Promise<FileObject> {
  const content = await fs
    .readFile(path.resolve(file))
    .then((res) => res.toString());

  const parsed = matter(content);

  return {
    path: file,
    data: parsed.data,
    // apply offset to ensure line numbers are correct
    content:
      '\n'.repeat(countLine(content) - countLine(parsed.content)) +
      parsed.content,
    url: pathToUrl ? pathToUrl(file) : undefined,
  };
}

export async function readFiles(
  patterns: Pattern | Pattern[],
  options: Partial<{
    pathToUrl?: PathToUrl;
  }> = {},
): Promise<FileObject[]> {
  const files = await FastGlob(patterns);

  return await Promise.all(
    files.map((file) => readFileFromPath(file, options.pathToUrl)),
  );
}

function countLine(s: string) {
  let out = 0;
  for (const c of s) {
    if (c === '\n') out++;
  }

  return out;
}
