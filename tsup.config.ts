import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "client/index": "src/client/index.ts",
    "server/index": "src/server/index.ts",
    "validator/index": "src/validator/index.ts",
    "scaffold/index": "src/scaffold/index.ts",
    "cli/index": "src/cli/index.ts",
  },
  format: ["esm"],
  target: "node20",
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  outDir: "dist",
  banner: (ctx) => {
    if (ctx.format === "esm" && ctx.entries?.some((e) => e.includes("cli/index"))) {
      return { js: "#!/usr/bin/env node" };
    }
    return {};
  },
});
