import { describe, expect, it } from "vitest";
import { runToolRules, TOOL_RULES } from "../../src/validator/rules/tool-rules.js";
import type { Tool } from "../../src/client/types.js";

const makeTool = (overrides: Partial<Tool>): Tool => ({
  name: "t",
  description: "d",
  inputSchema: { type: "object", properties: {} },
  ...overrides,
});

describe("tool rules — happy path", () => {
  it("a clean tool produces zero issues", () => {
    const issues = runToolRules([
      makeTool({
        name: "search_items",
        description: "Searches items",
        inputSchema: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"],
        },
      }),
    ]);
    expect(issues).toEqual([]);
  });
});

describe("tool-has-description", () => {
  it("emits warning when description is missing", () => {
    const issues = runToolRules([makeTool({ description: undefined })]);
    const match = issues.find((i) => i.rule === "tool-has-description");
    expect(match?.severity).toBe("warning");
  });
});

describe("tool-description-quality", () => {
  it("emits info when description is 'TODO'", () => {
    const issues = runToolRules([makeTool({ description: "TODO" })]);
    expect(issues.some((i) => i.rule === "tool-description-quality")).toBe(true);
  });

  it("emits info when description is empty string", () => {
    const issues = runToolRules([makeTool({ description: "" })]);
    expect(issues.some((i) => i.rule === "tool-description-quality")).toBe(true);
  });
});

describe("tool-schema-valid", () => {
  it("emits error when inputSchema is not an object", () => {
    const issues = runToolRules([
      makeTool({ inputSchema: "not-an-object" as unknown as Record<string, unknown> }),
    ]);
    expect(issues.some((i) => i.rule === "tool-schema-valid" && i.severity === "error")).toBe(true);
  });
});

describe("tool-schema-has-types", () => {
  it("emits warning when a property is missing 'type'", () => {
    const issues = runToolRules([
      makeTool({
        inputSchema: { type: "object", properties: { x: { description: "no type" } } },
      }),
    ]);
    expect(issues.some((i) => i.rule === "tool-schema-has-types")).toBe(true);
  });
});

describe("tool-required-fields-exist", () => {
  it("emits error when 'required' references a non-existent property", () => {
    const issues = runToolRules([
      makeTool({
        inputSchema: {
          type: "object",
          properties: { a: { type: "string" } },
          required: ["a", "b"],
        },
      }),
    ]);
    expect(
      issues.some((i) => i.rule === "tool-required-fields-exist" && i.severity === "error"),
    ).toBe(true);
  });
});

describe("tool-no-duplicate-names", () => {
  it("emits error once for duplicate names", () => {
    const issues = runToolRules([
      makeTool({ name: "a" }),
      makeTool({ name: "a" }),
      makeTool({ name: "b" }),
    ]);
    const matches = issues.filter((i) => i.rule === "tool-no-duplicate-names");
    expect(matches.length).toBe(1);
    expect(matches[0]?.severity).toBe("error");
  });
});

describe("TOOL_RULES registry", () => {
  it("exports 6 rule ids", () => {
    expect(TOOL_RULES.length).toBe(6);
    expect(new Set(TOOL_RULES.map((r) => r.id)).size).toBe(6);
  });
});
