import { remark } from 'remark';
import { visit } from 'unist-util-visit';
import type { ScanResult } from '@/scan';
import * as path from 'node:path';
import { checkExternalUrl } from './check-external-url';
import remarkGfm from 'remark-gfm';
import { readFileFromPath } from './sample';

const processor = remark().use(remarkGfm);

export type ValidateError = {
  file: string;
  detected: DetectedError[];
};

export type ErrorReason = 'not-found' | 'invalid-fragment' | 'invalid-query';
export type DetectedError = [
  url: string,
  line: number,
  column: number,
  reason: ErrorReason,
];

export type ValidateConfig = {
  /**
   * Available URLs (including hashes and query parameters)
   */
  scanned: ScanResult;

  /**
   * don't validate the fragment/hash of URLs
   *
   * @defaultValue false
   */
  ignoreFragment?: boolean;

  /**
   * don't validate the query of URLs
   *
   * @defaultValue false
   */
  ignoreQuery?: boolean;

  /**
   * Check external urls
   *
   * @defaultValue false
   */
  checkExternal?: boolean;
};

export type FileObject = {
  path: string;
  content: string;

  data?: object;
};

/**
 * Validate markdown files
 *
 * @param files - file paths or file objects
 * @param config - configurations
 */
export async function validateFiles(
  files: (string | FileObject)[],
  config: ValidateConfig,
): Promise<ValidateError[]> {
  const mdExtensions = ['.md', '.mdx'];

  async function run(file: string | FileObject): Promise<ValidateError> {
    const finalFile =
      typeof file === 'string' ? await readFileFromPath(file) : file;

    if (!mdExtensions.includes(path.extname(finalFile.path))) {
      console.warn(
        `format unsupported: ${finalFile.path}, supported: ${mdExtensions.join(', ')}`,
      );

      return { file: finalFile.path, detected: [] };
    }

    return {
      file: finalFile.path,
      detected: await validateMarkdown(finalFile.content, config),
    };
  }

  return (await Promise.all(files.map(run))).filter(
    (err) => err.detected.length > 0,
  );
}

export async function validateMarkdown(
  content: string,
  config: ValidateConfig,
) {
  const tree = processor.parse({ value: content });
  const detected: DetectedError[] = [];
  const tasks: Promise<void>[] = [];

  visit(tree, 'link', (node) => {
    // ignore generated nodes
    if (!node.position) return;
    const pos = node.position;

    tasks.push(
      detect(node.url, config).then((result) => {
        if (result) {
          detected.push([node.url, pos.start.line, pos.start.column, result]);
        }
      }),
    );
  });

  await Promise.all(tasks);

  return detected;
}

export async function detect(
  href: string,
  config: ValidateConfig,
): Promise<ErrorReason | undefined> {
  if (href.match(/https?:\/\//)) {
    if (config.checkExternal) {
      return await checkExternalUrl(href);
    }

    return;
  }

  const [pathnameWithQuery, fragment] = href.split('#', 2);
  const [pathname, query] = pathnameWithQuery.split('?', 2);

  if (pathname.length === 0) return;

  let meta = config.scanned.urls.get(pathname);
  if (!meta) {
    meta = config.scanned.fallbackUrls.find((fallbackUrl) => {
      return fallbackUrl.url.test(pathname);
    })?.meta;
  }

  if (!meta) return 'not-found';

  const validFragment =
    config.ignoreFragment ||
    !fragment ||
    !meta.hashes ||
    meta.hashes.includes(fragment);

  if (!validFragment) {
    return 'invalid-fragment';
  }

  const validQuery =
    config.ignoreQuery ||
    !query ||
    !meta.queries ||
    meta.queries.some((item) => new URLSearchParams(item).toString() === query);

  if (!validQuery) {
    return 'invalid-query';
  }
}
