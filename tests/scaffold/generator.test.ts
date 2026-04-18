import { execa } from "execa";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ScaffoldGenerator } from "../../src/scaffold/generator.js";
import type { ScaffoldConfig } from "../../src/scaffold/types.js";

describe("ScaffoldGenerator — TypeScript", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "kondukt-scaffold-ts-"));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it(
    "generates a TS project that installs and builds",
    async () => {
      const cfg: ScaffoldConfig = {
        name: "demo-ts-server",
        template: "typescript",
        description: "smoke test",
        tools: [
          {
            name: "echo",
            description: "Echo back",
            parameters: { text: { type: "string", description: "text", required: true } },
          },
        ],
        outputDir: tmp,
      };
      const result = await new ScaffoldGenerator().generate(cfg);
      const root = join(tmp, "demo-ts-server");
      expect(result.outputDir).toBe(root);
      expect(result.files).toContain("src/index.ts");
      expect(result.files).toContain("package.json");
      expect(result.files).toContain("tsconfig.json");
      expect(result.files).toContain(".gitignore");
      expect(result.files).toContain(".github/workflows/ci.yml");

      const indexTs = readFileSync(join(root, "src/index.ts"), "utf8");
      expect(indexTs).toContain('name: "echo"');
      const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
      expect(pkg.name).toBe("demo-ts-server");

      await execa("pnpm", ["install", "--ignore-scripts"], { cwd: root, timeout: 120_000 });
      await execa("pnpm", ["build"], { cwd: root, timeout: 60_000 });
      const distListing = readdirSync(join(root, "dist"));
      expect(distListing).toContain("index.js");
    },
    180_000,
  );
});

describe("ScaffoldGenerator — Python", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "kondukt-scaffold-py-"));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it("generates a Python project and the server parses as valid Python", async () => {
    const cfg: ScaffoldConfig = {
      name: "demo-py-server",
      template: "python",
      description: "smoke test",
      tools: [
        {
          name: "echo",
          description: "Echo back",
          parameters: { text: { type: "string", description: "text", required: true } },
        },
      ],
      outputDir: tmp,
    };
    const result = await new ScaffoldGenerator().generate(cfg);
    const root = join(tmp, "demo-py-server");
    expect(result.files).toContain("src/server.py");
    expect(result.files).toContain("pyproject.toml");

    const parse = await execa(
      "python3",
      ["-c", "import ast,sys; ast.parse(open(sys.argv[1]).read())", join(root, "src/server.py")],
      { reject: false, timeout: 20_000 },
    );
    expect(parse.exitCode).toBe(0);
  });
});
