import { defineConfig } from "waku/config";
import tailwindcss from "@tailwindcss/vite";
import press from "fumapress/vite";
import { fumadocsMdx } from "fumadocs-mdx/vite";

export default defineConfig({
  vite: {
    plugins: [
      press(),
      fumadocsMdx({
        globalOptions: {
          mdxOptions: {
            rehypeCodeOptions: {
              inline: "tailing-curly-colon",
              themes: {
                light: "catppuccin-latte",
                dark: "catppuccin-mocha",
              },
            },
          },
        },
      }),
      tailwindcss(),
    ],
  },
});
