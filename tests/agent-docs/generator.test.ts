import { describe, expect, it } from "vitest";
import { join } from "node:path";

import { AgentDocsGenerator } from "../../src/agent-docs/index.js";

const fixture = (name: string) => new URL(`./fixtures/${name}/`, import.meta.url).pathname;

describe("AgentDocsGenerator", () => {
  it("generates CLAUDE.md (default target) for ts-next with all expected sections", async () => {
    const result = await new AgentDocsGenerator().generate({ projectPath: fixture("ts-next") });
    expect(result.target).toBe("claude");
    expect(result.content).toContain("# ts-next-sample");
    expect(result.content).toContain("## Project overview");
    expect(result.content).toContain("Next.js");
    expect(result.content).toContain("Claude Code");
    expect(result.analysis.patterns.framework).toBe("Next.js");
  });

  it("generates AGENTS.md (codex target) with codex-specific note", async () => {
    const result = await new AgentDocsGenerator().generate({
      projectPath: fixture("ts-next"),
      target: "codex",
    });
    expect(result.target).toBe("codex");
    expect(result.outputPath.endsWith("/AGENTS.md")).toBe(true);
    expect(result.content).toContain("Codex");
  });

  it("generates GEMINI.md with gemini-specific note", async () => {
    const result = await new AgentDocsGenerator().generate({
      projectPath: fixture("ts-next"),
      target: "gemini",
    });
    expect(result.target).toBe("gemini");
    expect(result.outputPath.endsWith("/GEMINI.md")).toBe(true);
    expect(result.content).toContain("Gemini CLI");
  });

  it("generates for py-fastapi", async () => {
    const result = await new AgentDocsGenerator().generate({ projectPath: fixture("py-fastapi") });
    expect(result.content).toContain("# py-fastapi-sample");
    expect(result.content).toContain("FastAPI");
    expect(result.analysis.patterns.testFramework).toBe("Pytest");
  });

  it("self-test: generating for the Kondukt Core repo mentions Vitest + TypeScript", async () => {
    const result = await new AgentDocsGenerator().generate({
      projectPath: new URL("../../", import.meta.url).pathname,
    });
    expect(result.content).toContain("TypeScript");
    expect(result.content).toContain("Vitest");
    expect(result.content).toContain("# kondukt");
  });

  it("computes a default outputPath based on target", async () => {
    const path = fixture("ts-next");
    const claude = await new AgentDocsGenerator().generate({ projectPath: path });
    expect(claude.outputPath).toBe(join(path, "CLAUDE.md"));
    const codex = await new AgentDocsGenerator().generate({ projectPath: path, target: "codex" });
    expect(codex.outputPath).toBe(join(path, "AGENTS.md"));
  });
});
