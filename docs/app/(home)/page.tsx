import Link from "next/link";
import { CodeBlock } from "@/components/codeblock";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import packageJson from "../../../package.json";

const version = packageJson.version;

export default function Page() {
  return (
    <main className="flex-1 font-mono py-8 md:px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="border rounded-lg p-6 mb-8">
          <div className="flex items-center mb-4 border-b pb-2">
            <div className="flex gap-2">
              <div className="size-3 rounded-full bg-red-500"></div>
              <div className="size-3 rounded-full bg-yellow-500"></div>
              <div className="size-3 rounded-full bg-green-500"></div>
            </div>
            <div className="ml-4 text-sm">terminal@fuma-nama:~</div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-4 typing-animation">
              next-validate-link v{version}
            </h1>
            <p className="text-sm mb-4">
              A simple utility to validate links in your Markdown files. Never
              worry about broken documentation links again.
            </p>
          </div>

          <div className="mb-8">
            <p className="font-bold text-sm mb-2">$ Features</p>
            <ul className="text-sm list-decimal list-inside">
              <li>Automatic link checking</li>
              <li>Identifies outdated links</li>
              <li>Full Markdown compatibility</li>
              <li>URL fragment & query params validation</li>
            </ul>
          </div>

          <div className="mb-8">
            <p className="font-bold text-sm mb-2">$ Integrations</p>
            <p className="text-sm">{`->`} Next.js, Nuxt.js, Astro, Fumadocs.</p>
          </div>

          <div className="mb-8">
            <p className="text-sm font-medium mb-2">
              $ npm add next-validate-link
            </p>
            <CodeBlock
              lang="ts"
              code={`import { scanURLs, printErrors, readFiles, validateFiles } from 'next-validate-link';
 
const scanned = await scanURLs({
  preset: 'next'
});
 
printErrors(
  await validateFiles(await readFiles('content/**/*.{md,mdx}'), {
    scanned,
  }),
  true, // exit with code 1 if errors detected
);`}
            />
          </div>

          <div className="flex gap-4 mt-8">
            <Link
              href="/docs"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-border text-muted-foreground hover:bg-border/10",
              )}
            >
              $ cd /docs
            </Link>
            <a
              href="https://github.com/fuma-nama/next-validate-link"
              target="_blank"
              rel="noreferrer noopener"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-border text-muted-foreground hover:bg-border/10",
              )}
            >
              <svg
                fill="currentColor"
                className="size-4"
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>GitHub</title>
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              github
            </a>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <p className="text-sm mb-2 font-bold">$ cat how-it-works.md</p>
          <ul className="text-sm list-decimal list-inside">
            <li>
              Scans available URLs for Markdown files based on your Web
              framework
            </li>
            <li>Extracts all links from content (e.g. Markdown files)</li>
            <li>Validates each link</li>
            <li>Generates validation report</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
