import { describe, expect, it } from "vitest";
import { join } from "node:path";

import { ClaudeMdGenerator } from "../../src/claudemd/index.js";

const fixture = (name: string) => new URL(`./fixtures/${name}/`, import.meta.url).pathname;

describe("ClaudeMdGenerator", () => {
  it("generates a CLAUDE.md for ts-next with all expected sections", async () => {
    const result = await new ClaudeMdGenerator().generate({ projectPath: fixture("ts-next") });
    expect(result.content).toContain("# ts-next-sample");
    expect(result.content).toContain("## Project overview");
    expect(result.content).toContain("Next.js");
    expect(result.content).toContain("## Commands");
    expect(result.content).toContain("## Conventions");
    expect(result.analysis.patterns.framework).toBe("Next.js");
  });

  it("generates a CLAUDE.md for py-fastapi", async () => {
    const result = await new ClaudeMdGenerator().generate({ projectPath: fixture("py-fastapi") });
    expect(result.content).toContain("# py-fastapi-sample");
    expect(result.content).toContain("FastAPI");
    expect(result.analysis.patterns.testFramework).toBe("Pytest");
  });

  it("self-test: generating for the Kondukt Core repo mentions Vitest + TypeScript", async () => {
    const result = await new ClaudeMdGenerator().generate({
      projectPath: new URL("../../", import.meta.url).pathname,
    });
    expect(result.content).toContain("TypeScript");
    expect(result.content).toContain("Vitest");
    expect(result.content).toContain("# kondukt");
  });

  it("computes a default outputPath of <projectPath>/CLAUDE.md", async () => {
    const path = fixture("ts-next");
    const result = await new ClaudeMdGenerator().generate({ projectPath: path });
    expect(result.outputPath).toBe(join(path, "CLAUDE.md"));
  });
});
