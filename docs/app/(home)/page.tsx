import { buttonVariants } from '@/components/ui/button';
import { Github } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import packageJson from '../../../package.json';

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
              A powerful utility to validate links in your Next.js Markdown
              files. Never worry about broken documentation links again.
            </p>
          </div>

          <div className="mb-8">
            <p className="text-sm font-medium mb-2">$ ls features/</p>
            <pre className="mb-4 whitespace-pre text-sm">
              ├─ Automatic link checking
              <br />
              ├─ Identifies outdated links
              <br />
              ├─ Full Markdown compatibility
              <br />
              ├─ URL fragment validation
              <br />
              ├─ Dynamic route support
              <br />
              └─ Native support for Fumadocs
            </pre>
          </div>

          <div className="mb-8">
            <p className="text-sm font-medium mb-2">
              $ npm add next-validate-link
            </p>
            <DynamicCodeBlock
              lang="bash"
              code={`Installing next-validate-link...
Package next-validate-link installed successfully!`}
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
              <Github className="mr-2 size-4" />$ git clone
            </a>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <p className="text-sm mb-2 font-medium">$ cat how-it-works.md</p>
          <pre className="whitespace-pre text-sm">
            1. Scans project for Markdown files
            <br />
            2. Extracts all links from content
            <br />
            3. Validates each link
            <br />
            4. Generates validation report
          </pre>
        </div>
      </div>
    </main>
  );
}
