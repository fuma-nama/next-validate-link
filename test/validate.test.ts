import path from "node:path";
import { expect, test } from "vitest";
import { scanURLs } from "@/scan";
import { type ValidateResult, validateFiles } from "@/validate";

const scanned = await scanURLs({
  pages: [
    "page.tsx",
    "docs/page.tsx",
    "docs/[...slug]/page.tsx",
    "dynamic/[[...slug]]/page.tsx",
  ],
  populate: {
    "docs/[...slug]": [
      {
        value: ["a"],
      },
      {
        value: ["b"],
      },
      {
        value: ["c"],
      },
      {
        value: ["d"],
        hashes: ["hash"],
      },
    ],
  },
});

function simplify(results: ValidateResult[]) {
  return results.map((result) => ({
    file: result.file,
    errors: result.errors,
  }));
}

test("validate links: valid", async () => {
  const pathToUrl = (file: string) => {
    return ["docs", file.slice(0, -path.extname(file).length).split(path.sep)]
      .filter((v) => v.length > 0)
      .join("/");
  };

  expect(
    await validateFiles(
      [
        {
          path: "a.md",
          url: pathToUrl("a.md"),
          content: "[hello](/)",
        },
        {
          path: "b.md",
          url: pathToUrl("b.md"),
          content: "[hello](/docs) [hello](/docs/d) [hello](/docs/d#hash)",
        },
        {
          path: "c.md",
          url: pathToUrl("c.md"),
          content:
            "[hello](../dynamic) [hello](../dynamic/anything) [file](./b.md)",
        },
        {
          path: "d.md",
          url: pathToUrl("d.md"),
          content: "[hello](./) [hello](./a) example@example.com",
        },
      ],
      {
        scanned,
        pathToUrl,
      }
    ).then(simplify)
  ).toMatchInlineSnapshot(`[]`);
});

test("validate links: not found", async () => {
  expect(
    await validateFiles(
      [
        {
          path: "a.md",
          content: `[hello](/docs/invalid)
[hello](/doc)`,
        },
      ],
      { scanned }
    ).then(simplify)
  ).toMatchInlineSnapshot(`
    [
      {
        "errors": [
          {
            "column": 1,
            "line": 1,
            "reason": "not-found",
            "url": "/docs/invalid",
          },
          {
            "column": 1,
            "line": 2,
            "reason": "not-found",
            "url": "/doc",
          },
        ],
        "file": "a.md",
      },
    ]
  `);
});

test("validate links: invalid fragments", async () => {
  expect(
    await validateFiles(
      [
        {
          path: "a.md",
          content: "[hello](/docs/d#invalid)",
        },
      ],
      { scanned }
    ).then(simplify)
  ).toMatchInlineSnapshot(`
    [
      {
        "errors": [
          {
            "column": 1,
            "line": 1,
            "reason": "invalid-fragment",
            "url": "/docs/d#invalid",
          },
        ],
        "file": "a.md",
      },
    ]
  `);
});

test("validate links: external urls", async () => {
  expect(
    await validateFiles(
      [
        {
          path: "a.md",
          content: "https://google.com http://localhost:3000",
        },
        {
          path: "b.md",
          content: "https://invalid.com",
        },
      ],
      { scanned, checkExternal: true }
    ).then(simplify)
  ).toMatchInlineSnapshot(`
    [
      {
        "errors": [
          {
            "column": 1,
            "line": 1,
            "reason": "not-found",
            "url": "https://invalid.com",
          },
        ],
        "file": "b.md",
      },
    ]
  `);
});

test("validate links: line numbers", async () => {
  expect(
    await validateFiles(
      [
        {
          path: "a.md",
          content: `[line 1](/unknown)

[line 3](/unknown)

[line 5](/invalid)

some content [line 7](/test)`,
        },
      ],
      { scanned }
    ).then(simplify)
  ).toMatchInlineSnapshot(`
    [
      {
        "errors": [
          {
            "column": 1,
            "line": 1,
            "reason": "not-found",
            "url": "/unknown",
          },
          {
            "column": 1,
            "line": 3,
            "reason": "not-found",
            "url": "/unknown",
          },
          {
            "column": 1,
            "line": 5,
            "reason": "not-found",
            "url": "/invalid",
          },
          {
            "column": 14,
            "line": 7,
            "reason": "not-found",
            "url": "/test",
          },
        ],
        "file": "a.md",
      },
    ]
  `);
});

test("validate links: components", async () => {
  expect(
    await validateFiles(
      [
        {
          path: "a.mdx",
          content: `<Card href="/unknown">Hello World</Card>`,
        },
      ],
      {
        scanned,
        markdown: {
          components: {
            Card: { attributes: ["href"] },
          },
        },
      }
    ).then(simplify)
  ).toMatchInlineSnapshot(`
    [
      {
        "errors": [
          {
            "column": 1,
            "line": 1,
            "reason": "not-found",
            "url": "/unknown",
          },
        ],
        "file": "a.mdx",
      },
    ]
  `);
});
