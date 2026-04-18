import { describe, expect, it } from "vitest";
import { analyzeStructure } from "../../../src/claudemd/analyzers/structure.js";

const fixture = (name: string) => new URL(`../fixtures/${name}/`, import.meta.url).pathname;

describe("analyzeStructure", () => {
  it("lists top-level dirs and flags README presence for ts-next", () => {
    const s = analyzeStructure(fixture("ts-next"));
    expect(s.topLevelDirectories).toContain("src");
    expect(s.hasReadme).toBe(true);
    expect(s.relevantFiles).toContain("package.json");
    expect(s.relevantFiles).toContain("tsconfig.json");
  });

  it("detects src and tests dirs for ts-express", () => {
    const s = analyzeStructure(fixture("ts-express"));
    expect(s.topLevelDirectories).toContain("src");
    expect(s.topLevelDirectories).toContain("tests");
  });

  it("returns minimal facts for the empty fixture", () => {
    const s = analyzeStructure(fixture("empty"));
    expect(s.topLevelDirectories).toEqual([]);
    expect(s.hasReadme).toBe(false);
    expect(s.relevantFiles).toEqual([]);
  });
});
