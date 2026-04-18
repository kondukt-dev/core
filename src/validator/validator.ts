import type { McpConnection } from "../client/mcp-connection.js";
import { PROMPT_RULES, runPromptRules } from "./rules/prompt-rules.js";
import { PROTOCOL_RULES, runProtocolRules } from "./rules/protocol-rules.js";
import { RESOURCE_RULES, runResourceRules } from "./rules/resource-rules.js";
import { TOOL_RULES, runToolRules } from "./rules/tool-rules.js";
import { computeScore, countBuckets } from "./scoring.js";
import type { ValidationIssue, ValidationResult } from "./types.js";

const TOTAL_RULES =
  TOOL_RULES.length + RESOURCE_RULES.length + PROMPT_RULES.length + PROTOCOL_RULES.length;

export class SchemaValidator {
  async validate(conn: McpConnection): Promise<ValidationResult> {
    if (conn.status !== "connected") {
      throw new Error("SchemaValidator.validate requires a connected McpConnection");
    }
    const serverName = extractServerName(conn);

    const [tools, resources, prompts] = await Promise.all([
      conn.listTools().catch(() => []),
      conn.listResources().catch(() => []),
      conn.listPrompts().catch(() => []),
    ]);

    const issues: ValidationIssue[] = [
      ...runToolRules(tools),
      ...runResourceRules(resources),
      ...runPromptRules(prompts),
      ...(await runProtocolRules({ conn })),
    ];

    const score = computeScore(issues);
    const buckets = countBuckets(issues, TOTAL_RULES);
    const summary = buildSummary(score, buckets, issues);

    return {
      server: serverName,
      timestamp: new Date().toISOString(),
      score,
      passed: buckets.passed,
      failed: buckets.failed,
      warnings: buckets.warnings,
      issues,
      summary,
    };
  }
}

function extractServerName(conn: McpConnection): string {
  const bag = conn as unknown as { serverName?: string };
  return bag.serverName ?? "unknown";
}

function buildSummary(
  score: number,
  buckets: { passed: number; failed: number; warnings: number },
  issues: ValidationIssue[],
): string {
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const info = issues.filter((i) => i.severity === "info").length;
  return (
    `score ${score}/100 — ${buckets.passed} rules passed, ${buckets.failed} failed, ` +
    `${buckets.warnings} with warnings; issues: ${errors} error(s), ` +
    `${warnings} warning(s), ${info} info.`
  );
}
