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
  },
};

export const listToolsTool: ToolDef = {
  definition: {
    name: "list_tools",
    description: "List all tools exposed by the target MCP server.",
    inputSchema,
  },
  handler: async (params): Promise<ToolHandlerResult> => {
    let conn: McpConnection | undefined;
    try {
      conn = new McpConnection(buildConfigFromParams(params));
      await conn.connect();
      const tools = await conn.listTools();
      return { content: [{ type: "text", text: JSON.stringify(tools, null, 2) }] };
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
