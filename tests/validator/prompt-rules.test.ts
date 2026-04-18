import { describe, expect, it } from "vitest";
import { PROMPT_RULES, runPromptRules } from "../../src/validator/rules/prompt-rules.js";
import type { Prompt } from "../../src/client/types.js";

const p = (overrides: Partial<Prompt>): Prompt => ({
  name: "x",
  description: "d",
  arguments: [{ name: "a", description: "arg", required: true }],
  ...overrides,
});

describe("prompt rules", () => {
  it("clean prompt produces no issues", () => {
    expect(runPromptRules([p({})])).toEqual([]);
  });

  it("prompt-has-description emits warning when description missing", () => {
    const issues = runPromptRules([p({ description: undefined })]);
    expect(issues.some((i) => i.rule === "prompt-has-description")).toBe(true);
  });

  it("prompt-args-described emits info when an argument has no description", () => {
    const issues = runPromptRules([p({ arguments: [{ name: "a", required: true }] })]);
    expect(issues.some((i) => i.rule === "prompt-args-described")).toBe(true);
  });

  it("prompt-required-args-marked emits info when required flag is undefined", () => {
    const issues = runPromptRules([p({ arguments: [{ name: "a", description: "arg" }] })]);
    expect(issues.some((i) => i.rule === "prompt-required-args-marked")).toBe(true);
  });

  it("PROMPT_RULES has 3 unique rules", () => {
    expect(PROMPT_RULES.length).toBe(3);
    expect(new Set(PROMPT_RULES.map((r) => r.id)).size).toBe(3);
  });
});
