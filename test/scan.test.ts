import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { scanURLs } from "@/scan";

test("scan router from file system: Next.js app router", async () => {
  const urls = await scanURLs({
    cwd: path.join(fileURLToPath(import.meta.url), "../fixture/case-1"),
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

test("scan router from file system: Next.js mixed", async () => {
  const urls = await scanURLs({
    cwd: path.join(fileURLToPath(import.meta.url), "../fixture/case-2"),
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

test("scan router from file system: Astro", async () => {
  const urls = await scanURLs({
    preset: "astro",
    cwd: path.join(fileURLToPath(import.meta.url), "../fixture/astro-1"),
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

test("scan router from file system: Waku", async () => {
  const urls = await scanURLs({
    preset: "waku",
    cwd: path.join(fileURLToPath(import.meta.url), "../fixture/waku-1"),
  });

  expect(urls).toMatchInlineSnapshot(`
    {
      "fallbackUrls": [
        {
          "meta": {},
          "url": /\\^\\\\/\\(\\.\\+\\)\\\\/\\(\\.\\+\\)\\$/,
        },
        {
          "meta": {},
          "url": /\\^\\\\/\\(\\.\\+\\)\\$/,
        },
        {
          "meta": {},
          "url": /\\^\\\\/\\(\\.\\+\\)\\\\/settings\\$/,
        },
        {
          "meta": {},
          "url": /\\^\\\\/docs\\\\/\\(\\.\\+\\)\\$/,
        },
      ],
      "urls": Map {
        "/" => {},
        "/page" => {},
        "/docs" => {},
      },
    }
  `);
});

test("scan router from file system: React Router", async () => {
  const urls = await scanURLs({
    preset: "react-router",
    routerConfig: (await import("./fixture/react-router-1/route")).default,
  });

  expect(urls).toMatchInlineSnapshot(`
    {
      "fallbackUrls": [
        {
          "meta": {},
          "url": /\\^\\\\/projects\\\\/\\(\\.\\+\\)\\$/,
        },
        {
          "meta": {},
          "url": /\\^\\\\/projects\\\\/\\(\\.\\+\\)\\\\/edit\\$/,
        },
        {
          "meta": {},
          "url": /\\^\\\\/projects\\\\/\\(\\.\\+\\)\\\\/seek\\$/,
        },
      ],
      "urls": Map {
        "/contact" => {},
        "/projects" => {},
        "/projects/seek" => {},
      },
    }
  `);
});

test("scan router from file system: Nuxt", async () => {
  const urls = await scanURLs({
    preset: "nuxt",
    cwd: path.join(fileURLToPath(import.meta.url), "../fixture/nuxt-1"),
    populate: {
      "docs/[...slug]": [
        {
          value: "test",
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

test("scan router from file system: TanStack Start", async () => {
  const urls = await scanURLs({
    preset: "tanstack-start",
    cwd: path.join(
      fileURLToPath(import.meta.url),
      "../fixture/tanstack-start-1",
    ),
  });

  expect(urls).toMatchInlineSnapshot(`
    {
      "fallbackUrls": [
        {
          "meta": {},
          "url": /\\^\\\\/blog\\\\/\\(\\.\\+\\)\\\\/page\\$/,
        },
        {
          "meta": {},
          "url": /\\^\\\\/blog\\\\/\\(\\.\\+\\)\\$/,
        },
        {
          "meta": {},
          "url": /\\^\\\\/docs\\\\/\\(\\.\\+\\)\\$/,
        },
      ],
      "urls": Map {
        "/about" => {},
        "/" => {},
        "/static.json" => {},
        "/docs" => {},
      },
    }
  `);
});
