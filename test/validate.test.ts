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
        value: ['hello'],
      },
      {
        value: ['hello', 'world'],
        hashes: ['hash'],
      },
    ],
  },
});

test('validate links: valid', async () => {
  const pathToUrl = (file: string) => {
    return path.dirname(file);
  };
  expect(
    await validateFiles(
      [
        {
          path: 'a.md',
          content: '[hello](/)',
        },
        {
          path: 'b.md',
          content:
            '[hello](/docs) [hello](/docs/hello) [hello](/docs/hello/world#hash)',
        },
        {
          path: 'c.md',
          content: '[hello](/dynamic) [hello](/dynamic/anything)',
        },
        {
          path: 'd.md',
          url: pathToUrl('dynamic/d.md'),
          content: '[hello](./) [hello](./anything) example@example.com',
        },
      ],
      {
        scanned,
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
          content: '[hello](/docs/hello/world#invalid)',
        },
      ],
      { scanned },
    ),
  ).toMatchInlineSnapshot(`
    [
      {
        "detected": [
          [
            "/docs/hello/world#invalid",
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
