import path from "node:path";
import { getTableOfContents } from "fumadocs-core/content/toc";
import { getSlugs } from "fumadocs-core/source";
import {
  printErrors,
  readFiles,
  scanURLs,
  validateFiles,
} from "next-validate-link";

async function checkLinks() {
  // we read them all at once to avoid repeated file read
  const docsFiles = await readFiles("content/docs/**/*.{md,mdx}");

  // other collections too!
  const blogFiles = await readFiles("content/blog/**/*.{md,mdx}");

  const scanned = await scanURLs({
    populate: {
      "(home)/blog/[slug]": blogFiles.map((file) => {
        return {
          value: getSlugs(path.relative("content/blog", file.path))[0],
          hashes: getTableOfContents(file.content).map((item) =>
            item.url.slice(1),
          ),
        };
      }),
      "docs/[[...slug]]": docsFiles.map((file) => {
        return {
          value: getSlugs(path.relative("content/docs", file.path)),
          hashes: getTableOfContents(file.content).map((item) =>
            item.url.slice(1),
          ),
        };
      }),
    },
  });

  printErrors(
    await validateFiles([...docsFiles, ...blogFiles], {
      scanned,
    }),
    true,
  );
}

void checkLinks();
