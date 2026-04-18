import { describe, expect, it } from "vitest";
import { computeScore, countBuckets } from "../../src/validator/scoring.js";
import type { ValidationIssue } from "../../src/validator/types.js";

const issue = (severity: "error" | "warning" | "info", rule = "x"): ValidationIssue => ({
  severity,
  rule,
  message: "msg",
});

describe("computeScore", () => {
  it("returns 100 for empty issues", () => {
    expect(computeScore([])).toBe(100);
  });

  it("subtracts 10 per error", () => {
    expect(computeScore([issue("error"), issue("error")])).toBe(80);
  });

  it("subtracts 3 per warning", () => {
    expect(computeScore([issue("warning"), issue("warning"), issue("warning")])).toBe(91);
  });

  it("info does not affect score", () => {
    expect(computeScore([issue("info"), issue("info")])).toBe(100);
  });

  it("mixes: 2 errors + 3 warnings + 5 info = 100 - 20 - 9 = 71", () => {
    const issues = [
      issue("error"),
      issue("error"),
      issue("warning"),
      issue("warning"),
      issue("warning"),
      issue("info"),
      issue("info"),
      issue("info"),
      issue("info"),
      issue("info"),
    ];
    expect(computeScore(issues)).toBe(71);
  });

  it("clamps at 0", () => {
    const many = Array.from({ length: 20 }, () => issue("error"));
    expect(computeScore(many)).toBe(0);
  });
});

describe("countBuckets", () => {
  it("counts rules that passed, failed, and warned (by rule id)", () => {
    const issues = [
      issue("error", "r1"),
      issue("error", "r1"),
      issue("warning", "r2"),
      issue("info", "r3"),
    ];
    const buckets = countBuckets(issues, 10);
    expect(buckets.failed).toBe(1);
    expect(buckets.warnings).toBe(1);
    expect(buckets.passed).toBe(10 - 1 - 1);
  });

  it("a rule with both error and warning counts as failed only", () => {
    const issues = [issue("error", "r1"), issue("warning", "r1")];
    const buckets = countBuckets(issues, 5);
    expect(buckets.failed).toBe(1);
    expect(buckets.warnings).toBe(0);
  });
});
