import { describe, expect, it } from "vitest";
import { parseToolSpec } from "../../src/scaffold/tool-spec.js";

describe("parseToolSpec", () => {
  it("parses name:description with no params", () => {
    const tool = parseToolSpec("echo:Echo back");
    expect(tool.name).toBe("echo");
    expect(tool.description).toBe("Echo back");
    expect(tool.parameters).toEqual({});
  });

  it("parses a single param", () => {
    const tool = parseToolSpec("echo:Echo back:text:string");
    expect(tool.parameters).toEqual({
      text: { type: "string", description: "text parameter", required: true },
    });
  });

  it("parses multiple params", () => {
    const tool = parseToolSpec("search:Search items:query:string,limit:number");
    expect(Object.keys(tool.parameters).sort()).toEqual(["limit", "query"]);
    expect(tool.parameters.query?.type).toBe("string");
    expect(tool.parameters.limit?.type).toBe("number");
  });

  it("supports optional params via ?", () => {
    const tool = parseToolSpec("search:Search:query:string,limit?:number");
    expect(tool.parameters.query?.required).toBe(true);
    expect(tool.parameters.limit?.required).toBe(false);
    expect(Object.keys(tool.parameters).sort()).toEqual(["limit", "query"]);
  });

  it("throws on empty spec", () => {
    expect(() => parseToolSpec("")).toThrow(/non-empty/i);
  });

  it("throws when a param is missing its type", () => {
    expect(() => parseToolSpec("echo:Echo:text")).toThrow(/param.*type/i);
  });
});
