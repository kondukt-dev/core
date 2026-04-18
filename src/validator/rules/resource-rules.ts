import type { Resource } from "../../client/types.js";
import type { ValidationIssue } from "../types.js";

export interface ResourceRule {
  id: string;
  run: (resources: Resource[]) => ValidationIssue[];
}

export const resourceHasUri: ResourceRule = {
  id: "resource-has-uri",
  run: (resources) =>
    resources.flatMap((r, i) =>
      !r.uri || r.uri.length === 0
        ? [
            {
              severity: "error" as const,
              rule: "resource-has-uri",
              message: `Resource at index ${i} has an empty URI`,
              path: `resources[${i}].uri`,
              suggestion: "Every resource must have a non-empty URI.",
            },
          ]
        : [],
    ),
};

export const resourceValidUri: ResourceRule = {
  id: "resource-valid-uri",
  run: (resources) =>
    resources.flatMap((r, i) => {
      if (!r.uri) return [];
      try {
        new URL(r.uri);
        return [];
      } catch {
        return [
          {
            severity: "error" as const,
            rule: "resource-valid-uri",
            message: `Resource URI '${r.uri}' is not a valid URI`,
            path: `resources[${i}].uri`,
            suggestion: "Use a parseable URI with scheme (e.g. 'file:///...', 'https://...').",
          },
        ];
      }
    }),
};

export const resourceHasName: ResourceRule = {
  id: "resource-has-name",
  run: (resources) =>
    resources.flatMap((r, i) =>
      !r.name || r.name.length === 0
        ? [
            {
              severity: "warning" as const,
              rule: "resource-has-name",
              message: `Resource '${r.uri}' has no name`,
              path: `resources[${i}].name`,
              suggestion: "Add a human-readable name so clients can display it.",
            },
          ]
        : [],
    ),
};

export const resourceHasMime: ResourceRule = {
  id: "resource-has-mime",
  run: (resources) =>
    resources.flatMap((r, i) =>
      r.mimeType === undefined
        ? [
            {
              severity: "info" as const,
              rule: "resource-has-mime",
              message: `Resource '${r.uri}' has no mimeType`,
              path: `resources[${i}].mimeType`,
              suggestion: "Declaring mimeType helps clients render the content correctly.",
            },
          ]
        : [],
    ),
};

export const RESOURCE_RULES: readonly ResourceRule[] = [
  resourceHasUri,
  resourceValidUri,
  resourceHasName,
  resourceHasMime,
] as const;

export function runResourceRules(resources: Resource[]): ValidationIssue[] {
  return RESOURCE_RULES.flatMap((r) => r.run(resources));
}
