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
    tool_name: { type: "string", description: "Name of the tool to call." },
    arguments: { type: "object", description: "Arguments to pass to the tool." },
  },
  required: ["tool_name"],
};

export const callToolTool: ToolDef = {
  definition: {
    name: "call_tool",
    description: "Call a specific tool on the target MCP server and return its result.",
    inputSchema,
  },
  handler: async (params): Promise<ToolHandlerResult> => {
    let conn: McpConnection | undefined;
    try {
      const name = params["tool_name"];
      if (typeof name !== "string" || name.length === 0) {
        throw new Error("tool_name is required and must be a string");
      }
      const args = (params["arguments"] as Record<string, unknown> | undefined) ?? {};
      conn = new McpConnection(buildConfigFromParams(params));
      await conn.connect();
      const result = await conn.callTool(name, args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        ...(result.isError ? { isError: true } : {}),
      };
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
