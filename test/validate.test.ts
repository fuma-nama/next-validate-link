import { expect, test } from 'vitest';
import { scanURLs } from '@/scan';
import { validateFiles } from '@/validate';
import path from 'node:path';

const scanned = await scanURLs({
  pages: [
    'page.tsx',
    'docs/page.tsx',
    'docs/[...slug]/page.tsx',
    'dynamic/[[...slug]]/page.tsx',
  ],
  populate: {
    'docs/[...slug]': [
      {
        value: ['a'],
      },
      {
        value: ['b'],
      },
      {
        value: ['c'],
      },
      {
        value: ['d'],
        hashes: ['hash'],
      },
    ],
  },
});

test('validate links: valid', async () => {
  const pathToUrl = (file: string) => {
    return ['docs', file.slice(0, -path.extname(file).length).split(path.sep)]
      .filter((v) => v.length > 0)
      .join('/');
  };

  expect(
    await validateFiles(
      [
        {
          path: 'a.md',
          url: pathToUrl('a.md'),
          content: '[hello](/)',
        },
        {
          path: 'b.md',
          url: pathToUrl('b.md'),
          content: '[hello](/docs) [hello](/docs/d) [hello](/docs/d#hash)',
        },
        {
          path: 'c.md',
          url: pathToUrl('c.md'),
          content:
            '[hello](../dynamic) [hello](../dynamic/anything) [file](./b.md)',
        },
        {
          path: 'd.md',
          url: pathToUrl('d.md'),
          content: '[hello](./) [hello](./a) example@example.com',
        },
      ],
      {
        scanned,
        pathToUrl,
      },
    ),
  ).toMatchInlineSnapshot(`[]`);
});

test('validate links: not found', async () => {
  expect(
    await validateFiles(
      [
        {
          path: 'a.md',
          content: `[hello](/docs/invalid)
[hello](/doc)`,
        },
      ],
      { scanned },
    ),
  ).toMatchInlineSnapshot(`
    [
      {
        "detected": [
          [
            "/docs/invalid",
            1,
            1,
            "not-found",
          ],
          [
            "/doc",
            2,
            1,
            "not-found",
          ],
        ],
        "file": "a.md",
      },
    ]
  `);
});

test('validate links: invalid fragments', async () => {
  expect(
    await validateFiles(
      [
        {
          path: 'a.md',
          content: '[hello](/docs/d#invalid)',
        },
      ],
      { scanned },
    ),
  ).toMatchInlineSnapshot(`
    [
      {
        "detected": [
          [
            "/docs/d#invalid",
            1,
            1,
            "invalid-fragment",
          ],
        ],
        "file": "a.md",
      },
    ]
  `);
});

test('validate links: external urls', async () => {
  expect(
    await validateFiles(
      [
        {
          path: 'a.md',
          content: 'https://google.com http://localhost:3000',
        },
        {
          path: 'b.md',
          content: 'https://invalid.com',
        },
      ],
      { scanned, checkExternal: true },
    ),
  ).toMatchInlineSnapshot(`
    [
      {
        "detected": [
          [
            "https://invalid.com",
            1,
            1,
            "not-found",
          ],
        ],
        "file": "b.md",
      },
    ]
  `);
});
