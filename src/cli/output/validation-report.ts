import chalk from "chalk";

import type { ValidationIssue, ValidationResult } from "../../validator/index.js";

export function renderValidationReport(r: ValidationResult): string {
  const scoreColor = r.score >= 90 ? chalk.green : r.score >= 70 ? chalk.yellow : chalk.red;
  const lines: string[] = [
    chalk.bold(r.server),
    `Score: ${scoreColor(`${r.score}/100`)}`,
    chalk.dim(r.summary),
    "",
    `Passed: ${chalk.green(r.passed)} | Failed: ${chalk.red(r.failed)} | Warnings: ${chalk.yellow(r.warnings)}`,
  ];
  if (r.issues.length > 0) {
    lines.push("");
    for (const issue of sortIssues(r.issues)) {
      lines.push(renderIssue(issue));
    }
  }
  return lines.join("\n");
}

function renderIssue(issue: ValidationIssue): string {
  const tag = tagFor(issue.severity);
  const path = issue.path ? chalk.dim(` (${issue.path})`) : "";
  const head = `${tag} ${chalk.bold(issue.rule)}: ${issue.message}${path}`;
  const suggestion = issue.suggestion ? `\n  ${chalk.dim("→")} ${chalk.dim(issue.suggestion)}` : "";
  return head + suggestion;
}

function tagFor(severity: ValidationIssue["severity"]): string {
  if (severity === "error") return chalk.red.bold("[ERROR]");
  if (severity === "warning") return chalk.yellow.bold("[WARN] ");
  return chalk.dim("[INFO] ");
}

function sortIssues(issues: ValidationIssue[]): ValidationIssue[] {
  const order = { error: 0, warning: 1, info: 2 } as const;
  return [...issues].sort((a, b) => order[a.severity] - order[b.severity]);
}
