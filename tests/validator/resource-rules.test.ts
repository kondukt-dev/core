import { describe, expect, it } from "vitest";
import { RESOURCE_RULES, runResourceRules } from "../../src/validator/rules/resource-rules.js";
import type { Resource } from "../../src/client/types.js";

const r = (overrides: Partial<Resource>): Resource => ({
  uri: "mock://x",
  name: "x",
  mimeType: "text/plain",
  ...overrides,
});

describe("resource rules", () => {
  it("clean resource produces no issues", () => {
    expect(runResourceRules([r({})])).toEqual([]);
  });

  it("resource-has-uri emits error when uri is empty", () => {
    const issues = runResourceRules([r({ uri: "" })]);
    expect(issues.some((i) => i.rule === "resource-has-uri" && i.severity === "error")).toBe(true);
  });

  it("resource-valid-uri emits error when uri is unparseable", () => {
    const issues = runResourceRules([r({ uri: "not a uri" })]);
    expect(issues.some((i) => i.rule === "resource-valid-uri" && i.severity === "error")).toBe(
      true,
    );
  });

  it("resource-has-name emits warning when name is empty", () => {
    const issues = runResourceRules([r({ name: "" })]);
    expect(issues.some((i) => i.rule === "resource-has-name" && i.severity === "warning")).toBe(
      true,
    );
  });

  it("resource-has-mime emits info when mimeType is missing for non-text uri", () => {
    const issues = runResourceRules([r({ uri: "mock://binary-blob", mimeType: undefined })]);
    expect(issues.some((i) => i.rule === "resource-has-mime" && i.severity === "info")).toBe(true);
  });

  it("RESOURCE_RULES has 4 unique rules", () => {
    expect(RESOURCE_RULES.length).toBe(4);
    expect(new Set(RESOURCE_RULES.map((r) => r.id)).size).toBe(4);
  });
});
