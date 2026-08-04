import { defineConfig } from "fumapress";
import { fumadocsMdx } from "fumapress/adapters/mdx";
import { metaSchema, pageSchema } from "fumapress/adapters/mdx/schema";
import { createHomeLayout } from "fumapress/layouts/home";
import { createNotebookLayoutPage } from "fumapress/layouts/notebook";
import { linkValidationPlugin } from "fumapress/plugins/link-validation";
import { defineDocs } from "fumadocs-mdx/macro";
import { SponsorsMarquee } from "@fumari/sponsors";

const docs = defineDocs({
  dir: "content/docs",
  docs: {
    async: true,
    schema: pageSchema,
    lastModified: true,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

const NotebookLayout = createNotebookLayoutPage<typeof config.$context>({
  async render() {
    return {
      layoutProps: {
        tabs: false,
      },
      pageProps: {
        tableOfContent: {
          footer: <SponsorsMarquee />,
        },
      },
    };
  },
});

export const HomeLayout = createHomeLayout<typeof config.$context>({
  layoutProps: {
    links: [
      {
        text: "Documentation",
        url: "/docs",
      },
      {
        text: "Sponsors",
        url: "https://fuma-nama.dev/sponsors",
        external: true,
      },
    ],
  },
});

const config = defineConfig({
  content: docs.toFumadocsSource({
    baseDir: "docs",
  }),
  site: {
    name: "next-validate-link",
    baseUrl: import.meta.env.DEV
      ? "http://localhost:3000"
      : "https://next-validate-link.vercel.app",
    git: {
      user: "fuma-nama",
      branch: "dev",
      repo: "next-validate-link",
    },
  },
  meta: {
    root() {
      return (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin=""
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Geist:ital,wght@0,100..900;1,100..900&family=Geist+Mono:ital,wght@0,100..900;1,100..900&display=swap"
            rel="stylesheet"
          />
          <link rel="icon" href="/icon.png" type="image/png" />
          <meta
            name="description"
            content="A tool to validate links in Markdown files of your Next.js app"
          />
        </>
      );
    },
  },
  defaultLayoutProps: {
    nav: {
      title: <code className="text-sm">🔗 next-validate-link</code>,
    },
  },
  renderPage: (props) => <NotebookLayout {...props} />,
})
  .adapters(fumadocsMdx())
  .plugins(linkValidationPlugin());

export default config;
