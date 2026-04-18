import type { ValidationBuckets, ValidationIssue } from "./types.js";

const WEIGHT = { error: 10, warning: 3, info: 0 } as const;

export function computeScore(issues: ValidationIssue[]): number {
  const penalty = issues.reduce((sum, i) => sum + WEIGHT[i.severity], 0);
  const score = 100 - penalty;
  if (score < 0) return 0;
  if (score > 100) return 100;
  return score;
}

export function countBuckets(issues: ValidationIssue[], totalRules: number): ValidationBuckets {
  const rulesWithError = new Set<string>();
  const rulesWithWarning = new Set<string>();
  for (const i of issues) {
    if (i.severity === "error") rulesWithError.add(i.rule);
    else if (i.severity === "warning") rulesWithWarning.add(i.rule);
  }
  for (const rule of rulesWithError) rulesWithWarning.delete(rule);
  const failed = rulesWithError.size;
  const warnings = rulesWithWarning.size;
  const passed = Math.max(0, totalRules - failed - warnings);
  return { passed, failed, warnings };
}
