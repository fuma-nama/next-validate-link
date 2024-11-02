import fg from 'fast-glob';
import {
  printErrors,
  readFileFromPath,
  scanURLs,
  validateFiles,
} from 'next-validate-link';
import { getSlugs, parseFilePath } from 'fumadocs-core/source';
import { getTableOfContents } from 'fumadocs-core/server';
import fs from 'node:fs/promises';
import path from 'node:path';

async function checkLinks() {
  // we read them all at once to avoid repeated file read
  const docsFiles = await Promise.all(
    await fg('content/docs/**/*.{md,mdx}').then((files) =>
      files.map(readFileFromPath),
    ),
  );

  const scanned = await scanURLs({
    populate: {
      'docs/[[...slug]]': docsFiles.map((file) => {
        const info = parseFilePath(path.relative('content/docs', file.path));

        return {
          value: getSlugs(info),
          hashes: getTableOfContents(file.content).map((item) =>
            item.url.slice(1),
          ),
        };
      }),
    },
  });

  printErrors(
    await validateFiles(docsFiles, {
      scanned,
    }),
    true,
  );
}

void checkLinks();
