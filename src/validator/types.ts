export type Severity = "error" | "warning" | "info";

export interface ValidationIssue {
  severity: Severity;
  rule: string;
  message: string;
  path?: string;
  suggestion?: string;
}

export interface ValidationBuckets {
  passed: number;
  failed: number;
  warnings: number;
}

export interface ValidationResult {
  server: string;
  timestamp: string;
  score: number;
  passed: number;
  failed: number;
  warnings: number;
  issues: ValidationIssue[];
  summary: string;
}
