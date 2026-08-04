import { tegami } from "tegami";
import { runCli } from "tegami/cli";
import { github } from "tegami/plugins/github";
import { x } from "tinyexec";

const paper = tegami({
  ignore: ["docs"],
  npm: {
    trustedPublish: {
      provider: "github",
      workflow: "release.yml",
    },
  },
  plugins: [
    github({
      repo: "fuma-nama/next-validate-link",
      versionPr: {
        base: "dev",
      },
    }),
    {
      name: "build",
      async willPublish({ pkg }) {
        await x("pnpm", ["--filter", pkg.name, "run", "build"], {
          throwOnError: true,
        });
      },
    },
  ],
});

await runCli(paper);
