import { expect, test } from 'vitest';
import { scanURLs } from '@/scan';

test('scan pages', async () => {
  const scanned = await scanURLs({
    pages: ['page.tsx', 'docs/page.tsx', 'nested/docs/page.tsx'],
  });

  expect(scanned).toMatchInlineSnapshot(`
    {
      "fallbackUrls": [],
      "urls": Map {
        "/" => {},
        "/docs" => {},
        "/nested/docs" => {},
      },
    }
  `);
});

test('scan pages with meta', async () => {
  const scanned = await scanURLs({
    pages: ['page.tsx', 'docs/page.tsx', 'nested/docs/page.tsx'],
    meta: {
      '/': {
        hashes: ['test'],
      },
    },
  });

  expect(scanned).toMatchInlineSnapshot(`
    {
      "fallbackUrls": [],
      "urls": Map {
        "/" => {
          "hashes": [
            "test",
          ],
        },
        "/docs" => {},
        "/nested/docs" => {},
      },
    }
  `);
});

test('scan pages with params', async () => {
  const scanned = await scanURLs({
    pages: [
      'page.tsx',
      'docs/page.tsx',
      'docs/[...slug]/page.tsx',
      'nested/blog/[slug]/page.tsx',
      'nested/docs/[[...slug]]/page.tsx',
    ],
    populate: {
      'docs/[...slug]': [
        {
          value: ['hello'],
        },
        {
          value: ['hello', 'world'],
          hashes: ['hash'],
          queries: [
            {
              query: 'value',
            },
          ],
        },
      ],
      'nested/docs/[[...slug]]': [
        {
          value: ['hello'],
        },
        {
          value: [],
        },
      ],
      'nested/blog/[slug]': [
        {
          value: 'hello',
        },
      ],
    },
    meta: {
      'page.tsx': {
        hashes: ['test'],
      },
    },
  });

  expect(scanned).toMatchInlineSnapshot(`
    {
      "fallbackUrls": [],
      "urls": Map {
        "/" => {
          "hashes": [
            "test",
          ],
        },
        "/docs" => {},
        "/docs/hello" => {
          "value": [
            "hello",
          ],
        },
        "/docs/hello/world" => {
          "hashes": [
            "hash",
          ],
          "queries": [
            {
              "query": "value",
            },
          ],
          "value": [
            "hello",
            "world",
          ],
        },
        "/nested/blog/hello" => {
          "value": "hello",
        },
        "/nested/docs/hello" => {
          "value": [
            "hello",
          ],
        },
        "/nested/docs" => {
          "value": [],
        },
      },
    }
  `);
});

test('scan pages with dynamic params', async () => {
  const scanned = await scanURLs({
    pages: [
      'page.tsx',
      'docs/page.tsx',
      'docs/[...slug]/page.tsx',
      'blog/[[...slug]]/page.tsx',
    ],
  });

  expect(scanned).toMatchInlineSnapshot(`
    {
      "fallbackUrls": [
        {
          "meta": {},
          "url": /\\^\\\\/docs\\\\/\\(\\.\\+\\)\\$/,
        },
        {
          "meta": {},
          "url": /\\^\\\\/blog\\\\/\\(\\.\\+\\)\\$/,
        },
      ],
      "urls": Map {
        "/" => {},
        "/docs" => {},
        "/blog" => {},
      },
    }
  `);
});

test('scan pages with multiple params', async () => {
  const scanned = await scanURLs({
    pages: [
      'page.tsx',
      'projects/[lang]/[id]/page.tsx',
      'blog/[lang]/[...slug]/page.tsx',
      'docs/[lang]/[[...slug]]/page.tsx',
    ],
    populate: {
      'projects/[lang]/[id]': [
        {
          value: {
            lang: 'en',
            id: 'hello',
          },
        },
        {
          value: {
            lang: 'en',
            id: 'world',
          },
        },
        {
          value: {
            lang: 'cn',
            id: 'hi',
          },
        },
      ],
      'blog/[lang]': [
        {
          value: { lang: 'en' },
        },
        {
          value: { lang: 'cn' },
        },
      ],
      'docs/[lang]/[[...slug]]': [
        {
          value: { lang: 'en', slug: ['hello', 'world'] },
        },
        {
          value: { lang: 'cn', slug: [] },
        },
      ],
    },
  });

  expect(scanned).toMatchInlineSnapshot(`
    {
      "fallbackUrls": [
        {
          "meta": {
            "value": {
              "lang": "en",
            },
          },
          "url": /\\^\\\\/blog\\\\/en\\\\/\\(\\.\\+\\)\\$/,
        },
        {
          "meta": {
            "value": {
              "lang": "cn",
            },
          },
          "url": /\\^\\\\/blog\\\\/cn\\\\/\\(\\.\\+\\)\\$/,
        },
      ],
      "urls": Map {
        "/" => {},
        "/projects/en/hello" => {
          "value": {
            "id": "hello",
            "lang": "en",
          },
        },
        "/projects/en/world" => {
          "value": {
            "id": "world",
            "lang": "en",
          },
        },
        "/projects/cn/hi" => {
          "value": {
            "id": "hi",
            "lang": "cn",
          },
        },
        "/docs/en/hello/world" => {
          "value": {
            "lang": "en",
            "slug": [
              "hello",
              "world",
            ],
          },
        },
        "/docs/cn" => {
          "value": {
            "lang": "cn",
            "slug": [],
          },
        },
      },
    }
  `);
});
