import * as Base from 'fumadocs-ui/components/codeblock';
import { highlight } from 'fumadocs-core/highlight';
import { type HTMLAttributes } from 'react';

export async function CodeBlock({
  code,
  lang,
  ...rest
}: HTMLAttributes<HTMLElement> & {
  code: string;
  lang: string;
}) {
  return await highlight(code, {
    lang,
    components: {
      pre: (props) => (
        <Base.CodeBlock {...props} {...rest} keepBackground>
          <Base.Pre>{props.children}</Base.Pre>
        </Base.CodeBlock>
      ),
    },
    themes: {
      light: 'catppuccin-latte',
      dark: 'catppuccin-mocha',
    },
  });
}
