import { describe, expect, it } from "vitest";
import { analyzeScripts } from "../../../src/agent-docs/analyzers/scripts.js";

const fixture = (name: string) => new URL(`../fixtures/${name}/`, import.meta.url).pathname;

describe("analyzeScripts", () => {
  it("extracts npm scripts from ts-next", () => {
    const s = analyzeScripts(fixture("ts-next"));
    const names = s.commands.map((c) => c.name).sort();
    expect(names).toContain("build");
    expect(names).toContain("test");
    expect(names).toContain("dev");
    const build = s.commands.find((c) => c.name === "build");
    expect(build?.command).toBe("next build");
  });

  it("extracts project.scripts entries from Python pyproject.toml", () => {
    const s = analyzeScripts(fixture("py-fastapi"));
    expect(s.entryPoints).toContain("src.main:main");
  });

  it("returns empty facts for the empty fixture", () => {
    const s = analyzeScripts(fixture("empty"));
    expect(s.commands).toEqual([]);
    expect(s.entryPoints).toEqual([]);
  });
});
