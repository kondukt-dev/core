import { describe, expect, it } from "vitest";
import { renderClaudeMd } from "../../src/agent-docs/renderer.js";
import type { ProjectAnalysis } from "../../src/agent-docs/types.js";

const baseAnalysis: ProjectAnalysis = {
  projectPath: "/tmp/sample",
  dependencies: {
    language: "typescript",
    packageManager: "pnpm",
    runtime: "Node.js >=20",
    packageName: "sample",
    packageVersion: "0.1.0",
    packageDescription: "A sample project",
    dependencies: { express: "^4.0.0" },
    devDependencies: { vitest: "^3.0.0", eslint: "^9.0.0" },
    esm: true,
  },
  structure: {
    topLevelDirectories: ["src", "tests"],
    hasReadme: true,
    hasLicense: false,
    hasDockerfile: false,
    hasGithubWorkflows: true,
    relevantFiles: ["package.json", "tsconfig.json"],
  },
  scripts: {
    commands: [
      { name: "build", command: "tsc", purpose: "Build production artifacts" },
      { name: "test", command: "vitest run", purpose: "Run the test suite" },
    ],
    entryPoints: [],
  },
  patterns: {
    framework: "Express",
    testFramework: "Vitest",
    linter: "ESLint",
    typescriptStrict: true,
  },
};

describe("renderClaudeMd", () => {
  it("includes Project overview and Commands for a populated analysis", () => {
    const md = renderClaudeMd(baseAnalysis);
    expect(md).toContain("# sample");
    expect(md).toContain("A sample project");
    expect(md).toContain("## Project overview");
    expect(md).toContain("TypeScript");
    expect(md).toContain("Node.js >=20");
    expect(md).toContain("## Commands");
    expect(md).toMatch(/`pnpm build`/);
    expect(md).toContain("## Architecture");
    expect(md).toContain("- `src/`");
    expect(md).toContain("## Conventions");
    expect(md).toContain("Vitest");
    expect(md).toContain("Express");
    expect(md).toContain("TypeScript strict mode");
  });

  it("omits the Commands section when there are no scripts", () => {
    const md = renderClaudeMd({
      ...baseAnalysis,
      scripts: { commands: [], entryPoints: [] },
    });
    expect(md).not.toContain("## Commands");
  });

  it("omits the Architecture section when there are no directories", () => {
    const md = renderClaudeMd({
      ...baseAnalysis,
      structure: { ...baseAnalysis.structure, topLevelDirectories: [] },
    });
    expect(md).not.toContain("## Architecture");
  });

  it("omits Conventions when no patterns are detected", () => {
    const md = renderClaudeMd({
      ...baseAnalysis,
      patterns: {},
      dependencies: { ...baseAnalysis.dependencies, esm: false },
    });
    expect(md).not.toContain("## Conventions");
  });

  it("falls back to 'the project' as the title when packageName is missing", () => {
    const md = renderClaudeMd({
      ...baseAnalysis,
      dependencies: { ...baseAnalysis.dependencies, packageName: undefined },
    });
    expect(md.startsWith("# the project\n")).toBe(true);
  });
});
