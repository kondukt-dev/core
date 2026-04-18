import { describe, expect, it } from "vitest";
import { analyzeDependencies } from "../../../src/agent-docs/analyzers/dependencies.js";

const fixture = (name: string) => new URL(`../fixtures/${name}/`, import.meta.url).pathname;

describe("analyzeDependencies", () => {
  it("reads package.json for a TypeScript Next project", () => {
    const d = analyzeDependencies(fixture("ts-next"));
    expect(d.language).toBe("typescript");
    expect(d.packageManager).toBe("unknown");
    expect(d.runtime).toMatch(/Node\.js/);
    expect(d.packageName).toBe("ts-next-sample");
    expect(d.packageDescription).toContain("Next.js");
    expect(d.dependencies["next"]).toBeDefined();
    expect(d.devDependencies["vitest"]).toBeDefined();
    expect(d.esm).toBe(true);
  });

  it("reads pyproject.toml for a Python FastAPI project", () => {
    const d = analyzeDependencies(fixture("py-fastapi"));
    expect(d.language).toBe("python");
    expect(d.packageName).toBe("py-fastapi-sample");
    expect(d.runtime).toMatch(/Python/);
    expect(d.dependencies["fastapi"]).toBeDefined();
    expect(d.devDependencies["pytest"]).toBeDefined();
  });

  it("returns language=unknown for an empty directory", () => {
    const d = analyzeDependencies(fixture("empty"));
    expect(d.language).toBe("unknown");
    expect(d.dependencies).toEqual({});
    expect(d.devDependencies).toEqual({});
  });
});
