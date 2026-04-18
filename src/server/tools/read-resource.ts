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
    uri: { type: "string", description: "URI of the resource to read." },
  },
  required: ["uri"],
};

export const readResourceTool: ToolDef = {
  definition: {
    name: "read_resource",
    description: "Read the content of a specific resource from the target MCP server.",
    inputSchema,
  },
  handler: async (params): Promise<ToolHandlerResult> => {
    let conn: McpConnection | undefined;
    try {
      const uri = params["uri"];
      if (typeof uri !== "string" || uri.length === 0) {
        throw new Error("uri is required and must be a string");
      }
      conn = new McpConnection(buildConfigFromParams(params));
      await conn.connect();
      const content = await conn.readResource(uri);
      return { content: [{ type: "text", text: JSON.stringify(content, null, 2) }] };
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
