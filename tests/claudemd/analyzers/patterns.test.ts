import { describe, expect, it } from "vitest";
import { analyzePatterns } from "../../../src/claudemd/analyzers/patterns.js";
import { analyzeDependencies } from "../../../src/claudemd/analyzers/dependencies.js";
import { analyzeStructure } from "../../../src/claudemd/analyzers/structure.js";

const fixture = (name: string) => new URL(`../fixtures/${name}/`, import.meta.url).pathname;

describe("analyzePatterns", () => {
  it("detects Next.js + Zustand + Vitest + ESLint + Prettier for ts-next", () => {
    const path = fixture("ts-next");
    const deps = analyzeDependencies(path);
    const structure = analyzeStructure(path);
    const p = analyzePatterns(path, deps, structure);
    expect(p.framework).toBe("Next.js");
    expect(p.stateManagement).toBe("Zustand");
    expect(p.testFramework).toBe("Vitest");
    expect(p.linter).toBe("ESLint");
    expect(p.formatter).toBe("Prettier");
    expect(p.typescriptStrict).toBe(true);
  });

  it("detects Express + Prisma for ts-express", () => {
    const path = fixture("ts-express");
    const deps = analyzeDependencies(path);
    const structure = analyzeStructure(path);
    const p = analyzePatterns(path, deps, structure);
    expect(p.framework).toBe("Express");
    expect(p.orm).toBe("Prisma");
  });

  it("detects FastAPI + SQLAlchemy + Pytest for py-fastapi", () => {
    const path = fixture("py-fastapi");
    const deps = analyzeDependencies(path);
    const structure = analyzeStructure(path);
    const p = analyzePatterns(path, deps, structure);
    expect(p.framework).toBe("FastAPI");
    expect(p.orm).toBe("SQLAlchemy");
    expect(p.testFramework).toBe("Pytest");
  });

  it("returns empty facts for empty project", () => {
    const path = fixture("empty");
    const deps = analyzeDependencies(path);
    const structure = analyzeStructure(path);
    const p = analyzePatterns(path, deps, structure);
    expect(p.framework).toBeUndefined();
    expect(p.orm).toBeUndefined();
    expect(p.testFramework).toBeUndefined();
  });
});
