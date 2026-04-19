import type { Prompt } from "../../client/types.js";
import type { ValidationIssue } from "../types.js";

export interface PromptRule {
  id: string;
  run: (prompts: Prompt[]) => ValidationIssue[];
}

export const promptHasDescription: PromptRule = {
  id: "prompt-has-description",
  run: (prompts) =>
    prompts.flatMap((p, i) =>
      p.description === undefined
        ? [
            {
              severity: "warning" as const,
              rule: "prompt-has-description",
              message: `Prompt '${p.name}' has no description`,
              path: `prompts[${i}].description`,
              suggestion: "Add a one-line description so users know when to use this prompt.",
            },
          ]
        : [],
    ),
};

export const promptArgsDescribed: PromptRule = {
  id: "prompt-args-described",
  run: (prompts) => {
    const out: ValidationIssue[] = [];
    prompts.forEach((p, i) => {
      (p.arguments ?? []).forEach((a, j) => {
        if (a.description === undefined) {
          out.push({
            severity: "info",
            rule: "prompt-args-described",
            message: `Prompt '${p.name}' argument '${a.name}' has no description`,
            path: `prompts[${i}].arguments[${j}]`,
            suggestion: "Describe what the argument represents so users know what to provide.",
          });
        }
      });
    });
    return out;
  },
};

export const promptRequiredArgsMarked: PromptRule = {
  id: "prompt-required-args-marked",
  run: (prompts) => {
    const out: ValidationIssue[] = [];
    prompts.forEach((p, i) => {
      (p.arguments ?? []).forEach((a, j) => {
        if (a.required === undefined) {
          out.push({
            severity: "info",
            rule: "prompt-required-args-marked",
            message: `Prompt '${p.name}' argument '${a.name}' does not declare 'required'`,
            path: `prompts[${i}].arguments[${j}].required`,
            suggestion: "Set 'required' explicitly to true or false.",
          });
        }
      });
    });
    return out;
  },
};

export const PROMPT_RULES: readonly PromptRule[] = [
  promptHasDescription,
  promptArgsDescribed,
  promptRequiredArgsMarked,
] as const;

export function runPromptRules(prompts: Prompt[]): ValidationIssue[] {
  return PROMPT_RULES.flatMap((r) => r.run(prompts));
}
