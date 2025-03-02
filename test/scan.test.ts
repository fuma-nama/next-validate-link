import { scanURLs } from '@/scan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

test('scan router from file system: Next.js app router', async () => {
  const urls = await scanURLs({
    cwd: path.join(fileURLToPath(import.meta.url), '../fixture/case-1'),
  });

  expect(urls).toMatchInlineSnapshot(`
    {
      "fallbackUrls": [],
      "urls": Map {
        "/" => {},
        "/another" => {},
      },
    }
  `);
});

test('scan router from file system: Next.js mixed', async () => {
  const urls = await scanURLs({
    cwd: path.join(fileURLToPath(import.meta.url), '../fixture/case-2'),
  });

  expect(urls).toMatchInlineSnapshot(`
    {
      "fallbackUrls": [
        {
          "meta": {},
          "url": /\\^\\\\/\\(\\.\\+\\)\\$/,
        },
      ],
      "urls": Map {
        "/" => {},
        "/test" => {},
      },
    }
  `);
});

test('scan router from file system: Astro', async () => {
  const urls = await scanURLs({
    preset: 'astro',
    cwd: path.join(fileURLToPath(import.meta.url), '../fixture/astro-1'),
  });

  expect(urls).toMatchInlineSnapshot(`
    {
      "fallbackUrls": [
        {
          "meta": {},
          "url": /\\^\\\\/\\(\\.\\+\\)\\$/,
        },
      ],
      "urls": Map {
        "/" => {},
        "/test" => {},
      },
    }
  `);
});

test('scan router from file system: Nuxt', async () => {
  const urls = await scanURLs({
    preset: 'nuxt',
    cwd: path.join(fileURLToPath(import.meta.url), '../fixture/nuxt-1'),
    populate: {
      'docs/[...slug]': [
        {
          value: 'test',
        },
      ],
    },
  });

  expect(urls).toMatchInlineSnapshot(`
    {
      "fallbackUrls": [
        {
          "meta": {},
          "url": /\\^\\\\/blog\\\\/\\(\\.\\+\\)\\$/,
        },
      ],
      "urls": Map {
        "/" => {},
        "/docs/test" => {
          "value": "test",
        },
      },
    }
  `);
});
