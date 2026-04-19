import type { Tool } from "../../client/types.js";
import type { ValidationIssue } from "../types.js";

export interface ToolRule {
  id: string;
  run: (tools: Tool[]) => ValidationIssue[];
}

const SNAKE_CASE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const TODO_RE = /^(TODO|FIXME|XXX)$/i;

function forEachTool(
  tools: Tool[],
  check: (tool: Tool, index: number) => ValidationIssue | undefined,
): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  for (let i = 0; i < tools.length; i++) {
    const issue = check(tools[i]!, i);
    if (issue) out.push(issue);
  }
  return out;
}

export const toolHasDescription: ToolRule = {
  id: "tool-has-description",
  run: (tools) =>
    forEachTool(tools, (t, i) => {
      if (t.description === undefined) {
        return {
          severity: "warning",
          rule: "tool-has-description",
          message: `Tool '${t.name}' has no description`,
          path: `tools[${i}]`,
          suggestion: "Add a 'description' field so users know what the tool does.",
        };
      }
      return undefined;
    }),
};

export const toolDescriptionQuality: ToolRule = {
  id: "tool-description-quality",
  run: (tools) =>
    forEachTool(tools, (t, i) => {
      if (t.description === undefined) return undefined;
      const trimmed = t.description.trim();
      if (trimmed === "" || TODO_RE.test(trimmed)) {
        return {
          severity: "info",
          rule: "tool-description-quality",
          message: `Tool '${t.name}' description is empty or placeholder ('${t.description}')`,
          path: `tools[${i}].description`,
          suggestion: "Write a one-line description of what the tool does.",
        };
      }
      return undefined;
    }),
};

export const toolSchemaValid: ToolRule = {
  id: "tool-schema-valid",
  run: (tools) =>
    forEachTool(tools, (t, i) => {
      if (!t.inputSchema || typeof t.inputSchema !== "object" || Array.isArray(t.inputSchema)) {
        return {
          severity: "error",
          rule: "tool-schema-valid",
          message: `Tool '${t.name}' inputSchema is not a valid JSON Schema object`,
          path: `tools[${i}].inputSchema`,
        };
      }
      return undefined;
    }),
};

export const toolSchemaHasTypes: ToolRule = {
  id: "tool-schema-has-types",
  run: (tools) => {
    const out: ValidationIssue[] = [];
    tools.forEach((t, i) => {
      const schema = t.inputSchema as { properties?: Record<string, unknown> };
      const props = schema.properties;
      if (!props || typeof props !== "object") return;
      for (const [name, def] of Object.entries(props)) {
        if (!def || typeof def !== "object" || !("type" in def)) {
          out.push({
            severity: "warning",
            rule: "tool-schema-has-types",
            message: `Tool '${t.name}' property '${name}' is missing 'type'`,
            path: `tools[${i}].inputSchema.properties.${name}`,
            suggestion: "Add a 'type' field so the client knows how to render the input.",
          });
        }
      }
    });
    return out;
  },
};

export const toolRequiredFieldsExist: ToolRule = {
  id: "tool-required-fields-exist",
  run: (tools) => {
    const out: ValidationIssue[] = [];
    tools.forEach((t, i) => {
      const schema = t.inputSchema as {
        properties?: Record<string, unknown>;
        required?: unknown;
      };
      const required = schema.required;
      if (!Array.isArray(required)) return;
      const propNames = new Set(Object.keys(schema.properties ?? {}));
      for (const name of required) {
        if (typeof name !== "string" || !propNames.has(name)) {
          out.push({
            severity: "error",
            rule: "tool-required-fields-exist",
            message: `Tool '${t.name}' required field '${String(name)}' is not a declared property`,
            path: `tools[${i}].inputSchema.required`,
            suggestion: "Remove the missing field from 'required' or add it under 'properties'.",
          });
        }
      }
    });
    return out;
  },
};

export const toolNameConvention: ToolRule = {
  id: "tool-name-convention",
  run: (tools) =>
    forEachTool(tools, (t, i) => {
      if (!SNAKE_CASE.test(t.name)) {
        return {
          severity: "info",
          rule: "tool-name-convention",
          message: `Tool name '${t.name}' is not snake_case`,
          path: `tools[${i}].name`,
          suggestion: "Rename to snake_case (e.g. 'search_items').",
        };
      }
      return undefined;
    }),
};

export const toolNoDuplicateNames: ToolRule = {
  id: "tool-no-duplicate-names",
  run: (tools) => {
    const seen = new Set<string>();
    const dups = new Set<string>();
    for (const t of tools) {
      if (seen.has(t.name)) dups.add(t.name);
      seen.add(t.name);
    }
    return [...dups].map((name) => ({
      severity: "error" as const,
      rule: "tool-no-duplicate-names",
      message: `Duplicate tool name '${name}'`,
      suggestion: "Rename one of the tools; names must be unique.",
    }));
  },
};

export const TOOL_RULES: readonly ToolRule[] = [
  toolHasDescription,
  toolDescriptionQuality,
  toolSchemaValid,
  toolSchemaHasTypes,
  toolRequiredFieldsExist,
  toolNameConvention,
  toolNoDuplicateNames,
] as const;

export function runToolRules(tools: Tool[]): ValidationIssue[] {
  return TOOL_RULES.flatMap((r) => r.run(tools));
}
