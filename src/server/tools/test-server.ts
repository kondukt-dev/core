import { McpConnection } from "../../client/index.js";
import { buildConfigFromParams } from "../params.js";
import type { ToolDef, ToolHandlerResult } from "../types.js";

const description =
  "Connect to an MCP server (stdio or HTTP) and return its capabilities " +
  "(protocol version, tool/resource/prompt counts, server name/version).";

const inputSchema = {
  type: "object",
  properties: {
    command: {
      type: "string",
      description: "Command to start the server via stdio (e.g. 'npx my-server').",
    },
    url: { type: "string", description: "URL of remote HTTP MCP server." },
    auth_type: { type: "string", enum: ["none", "bearer", "api-key"] },
    auth_value: { type: "string", description: "Bearer token or api-key value." },
    auth_header: { type: "string", description: "Header name for api-key auth." },
    timeout: { type: "number", description: "Per-request timeout in ms." },
  },
};

export const testServerTool: ToolDef = {
  definition: { name: "test_server", description, inputSchema },
  handler: async (params): Promise<ToolHandlerResult> => {
    let conn: McpConnection | undefined;
    try {
      const cfg = buildConfigFromParams(params);
      conn = new McpConnection(cfg);
      const info = await conn.connect();
      return { content: [{ type: "text", text: JSON.stringify(info, null, 2) }] };
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
