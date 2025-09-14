import fs from "node:fs/promises";
import matter from "gray-matter";
import type { FileObject } from "./validate";
import { glob } from "tinyglobby";

export type PathToUrl = (path: string) => string | undefined;

export async function readFileFromPath(
  file: string,
  pathToUrl?: PathToUrl,
): Promise<FileObject> {
  const content = await fs.readFile(file).then((res) => res.toString());

  const parsed = matter(content);

  return {
    path: file,
    data: parsed.data,
    // apply offset to ensure line numbers are correct
    content:
      "\n".repeat(countLine(content) - countLine(parsed.content)) +
      parsed.content,
    url: pathToUrl ? pathToUrl(file) : undefined,
  };
}

export async function readFiles(
  patterns: string | readonly string[],
  options: Partial<{
    pathToUrl?: PathToUrl;
  }> = {},
): Promise<FileObject[]> {
  const files = await glob(patterns);

  return await Promise.all(
    files.map((file) => readFileFromPath(file, options.pathToUrl)),
  );
}

function countLine(s: string) {
  let out = 0;
  for (const c of s) {
    if (c === "\n") out++;
  }

  return out;
}
