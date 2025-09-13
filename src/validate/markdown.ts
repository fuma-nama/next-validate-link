import { Detector, FileObject, ValidateError } from "@/validate";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import type { Node, Root, RootContent } from "mdast";
import remarkMdx from "remark-mdx";
import type { PluggableList } from "unified";

const mdProcessor = remark().use(remarkGfm);
const mdxProcessor = remark().use(remarkMdx).use(remarkGfm);

export interface MarkdownConfig {
  /**
   * scan href from attributes in MDX components
   */
  components?: Record<
    string,
    {
      attributes: string[];
    }
  >;

  remarkPlugins?: PluggableList;

  /**
   * control how URLs are scanned from Markdown content, override all default behaviours.
   */
  onNode?: (node: Node) => {
    hrefs: string[];
  };
}

export async function validateMarkdown(
  file: FileObject,
  detector: Detector,
  config: MarkdownConfig
) {
  const isMdx = file.path.endsWith(".mdx");
  const {
    components = {},
    remarkPlugins = [],
    onNode = (_node) => {
      const node = _node as RootContent;
      if (node.type === "link") {
        return {
          hrefs: [node.url],
        };
      }

      if (
        (node.type === "mdxJsxFlowElement" ||
          node.type === "mdxJsxTextElement") &&
        node.name &&
        node.name in components
      ) {
        const analyze = components[node.name];

        const hrefs: string[] = [];
        for (const attr of node.attributes) {
          // cannot analyze non-primitive inputs
          if (attr.type !== "mdxJsxAttribute" || typeof attr.value !== "string")
            continue;
          if (!analyze.attributes.includes(attr.name)) continue;

          hrefs.push(attr.value);
        }

        return { hrefs };
      }
    },
  } = config;
  const vfile = {
    path: file.path,
    value: file.content,
  };

  let tree = (isMdx ? mdxProcessor : mdProcessor)
    .use(remarkPlugins)
    .parse(vfile);
  if (remarkPlugins.length > 0)
    tree = (await remark().use(remarkPlugins).run(tree, vfile)) as Root;

  const errors: ValidateError[] = [];
  const tasks: Promise<void>[] = [];

  visit(tree, (node) => {
    // ignore generated nodes
    if (!node.position) return;
    const pos = node.position;
    const scanned = onNode(node);
    if (!scanned) return;

    for (const href of scanned.hrefs) {
      tasks.push(
        detector
          .detect(href)
          .then((err) => {
            if (!err || err.type !== "error") return;

            errors.push({
              url: href,
              line: pos.start.line,
              column: pos.start.column,
              reason: err.reason,
            });
          })
          .catch((err: Error) => {
            errors.push({
              url: href,
              line: pos.start.line,
              column: pos.start.column,
              reason: err,
            });
          })
      );
    }
  });

  await Promise.all(tasks);

  return errors;
}
