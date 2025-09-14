import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { readFileFromPath } from "@/sample";

const dir = path.dirname(fileURLToPath(import.meta.url));

test("read from files with frontmatter", async () => {
  expect(
    await readFileFromPath(
      path.relative(process.cwd(), path.join(dir, "fixture/sample/index.md")),
    ),
  ).toMatchInlineSnapshot(`
    {
      "content": "



    # Hello World

    This is [link](/unknown).
    ",
      "data": {
        "title": "Frontmatter",
      },
      "path": "test/fixture/sample/index.md",
      "url": undefined,
    }
  `);
});
