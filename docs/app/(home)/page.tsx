import { buttonVariants } from '@/components/ui/button';
import { Github } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import packageJson from '../../../package.json';
import { CodeBlock } from '@/components/codeblock';

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
              code={`import { scanURLs, printErrors, validateFiles } from 'next-validate-link';
import fg from 'fast-glob';
 
const scanned = await scanURLs({
  preset: 'next'
});
 
printErrors(
  await validateFiles(await fg('content/**/*.{md,mdx}'), {
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
                buttonVariants({ variant: 'outline' }),
                'border-border text-muted-foreground hover:bg-border/10',
              )}
            >
              $ cd /docs
            </Link>
            <a
              href="https://github.com/fuma-nama/next-validate-link"
              target="_blank"
              rel="noreferrer noopener"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'border-border text-muted-foreground hover:bg-border/10',
              )}
            >
              <Github className="mr-2 size-4" />
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
