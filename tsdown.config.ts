import { defineConfig } from "tsdown";

export default defineConfig({
  dts: true,
  target: "es2023",
  entry: ["./src/index.ts"],
  format: "esm",
  exports: true,
  deps: {
    onlyBundle: [],
  }
});
