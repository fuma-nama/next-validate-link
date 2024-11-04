import { scanURLs } from '@/scan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

test('scan router from file system: app router', async () => {
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

test('scan router from file system: mixed', async () => {
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
