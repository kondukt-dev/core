import { McpConnection } from "../../client/index.js";
import { buildConfigFromParams } from "../params.js";
import type { ToolDef, ToolHandlerResult } from "../types.js";

const inputSchema = {
  type: "object",
  properties: {
    command: { type: "string" },
    url: { type: "string" },
    auth_type: { type: "string", enum: ["none", "bearer", "api-key"] },
    auth_value: { type: "string" },
    auth_header: { type: "string" },
    timeout: { type: "number" },
    prompt_name: { type: "string", description: "Name of the prompt." },
    arguments: { type: "object", description: "Arguments to render the prompt." },
  },
  required: ["prompt_name"],
};

export const getPromptTool: ToolDef = {
  definition: {
    name: "get_prompt",
    description: "Render a named prompt from the target MCP server and return the messages.",
    inputSchema,
  },
  handler: async (params): Promise<ToolHandlerResult> => {
    let conn: McpConnection | undefined;
    try {
      const name = params["prompt_name"];
      if (typeof name !== "string" || name.length === 0) {
        throw new Error("prompt_name is required and must be a string");
      }
      const args = params["arguments"] as Record<string, string> | undefined;
      conn = new McpConnection(buildConfigFromParams(params));
      await conn.connect();
      const result = await conn.getPrompt(name, args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
        isError: true,
      };
    } finally {
      if (conn) await conn.disconnect().catch(() => undefined);
    }
  },
};
