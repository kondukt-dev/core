import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ScaffoldGenerator } from "../../scaffold/index.js";
import type { ScaffoldConfig, ScaffoldParameter, TemplateName } from "../../scaffold/index.js";
import type { ToolDef, ToolHandlerResult } from "../types.js";

const description =
  "Generate a new MCP server project from a template (typescript or python) with " +
  "the given tools. Returns the output directory and next-step instructions.";

const inputSchema = {
  type: "object",
  properties: {
    name: { type: "string", description: "Project name (used for directory and package name)." },
    template: { type: "string", enum: ["typescript", "python"] },
    description: { type: "string" },
    output_dir: {
      type: "string",
      description: "Parent directory to write the project into. Defaults to a tmp directory.",
    },
    tools: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          parameters: {
            type: "object",
            additionalProperties: {
              type: "object",
              properties: {
                type: { type: "string" },
                description: { type: "string" },
                required: { type: "boolean" },
              },
              required: ["type", "description"],
            },
          },
        },
        required: ["name", "description"],
      },
    },
  },
  required: ["name", "template"],
};

export const scaffoldServerTool: ToolDef = {
  definition: { name: "scaffold_server", description, inputSchema },
  handler: async (params): Promise<ToolHandlerResult> => {
    try {
      const name = requireString(params, "name");
      const template = requireString(params, "template") as TemplateName;
      if (template !== "typescript" && template !== "python") {
        throw new Error(`Unsupported template '${template}' — use 'typescript' or 'python'`);
      }
      const outputDir =
        (params["output_dir"] as string | undefined) ??
        mkdtempSync(join(tmpdir(), "kondukt-scaffold-"));
      const toolsRaw = (params["tools"] as unknown[] | undefined) ?? [];
      const tools = toolsRaw.map((t) => normalizeTool(t));
      const descriptionField = params["description"] as string | undefined;

      const cfg: ScaffoldConfig = {
        name,
        template,
        ...(descriptionField !== undefined ? { description: descriptionField } : {}),
        tools,
        outputDir,
      };

      const result = await new ScaffoldGenerator().generate(cfg);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
        isError: true,
      };
    }
  },
};

function requireString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  if (typeof v !== "string" || v.length === 0) {
    throw new Error(`'${key}' is required and must be a non-empty string`);
  }
  return v;
}

function normalizeTool(raw: unknown): {
  name: string;
  description: string;
  parameters: Record<string, ScaffoldParameter>;
} {
  if (!raw || typeof raw !== "object") {
    throw new Error("Each tool must be an object with 'name' and 'description'");
  }
  const t = raw as Record<string, unknown>;
  const name = t["name"];
  const desc = t["description"];
  if (typeof name !== "string") throw new Error("Tool.name must be a string");
  if (typeof desc !== "string") throw new Error("Tool.description must be a string");
  const parameters: Record<string, ScaffoldParameter> = {};
  const paramsRaw = (t["parameters"] as Record<string, unknown> | undefined) ?? {};
  for (const [k, v] of Object.entries(paramsRaw)) {
    if (!v || typeof v !== "object") continue;
    const p = v as Record<string, unknown>;
    parameters[k] = {
      type: typeof p["type"] === "string" ? p["type"] : "string",
      description: typeof p["description"] === "string" ? p["description"] : `${k} parameter`,
      ...(typeof p["required"] === "boolean" ? { required: p["required"] } : {}),
    };
  }
  return { name, description: desc, parameters };
}
