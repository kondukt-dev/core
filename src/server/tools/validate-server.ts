import { McpConnection } from "../../client/index.js";
import { SchemaValidator } from "../../validator/index.js";
import { buildConfigFromParams } from "../params.js";
import type { ToolDef, ToolHandlerResult } from "../types.js";

const description =
  "Validate the target MCP server against the protocol specification " +
  "and return a scored report with issues and suggestions.";

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

export const validateServerTool: ToolDef = {
  definition: { name: "validate_server", description, inputSchema },
  handler: async (params): Promise<ToolHandlerResult> => {
    let conn: McpConnection | undefined;
    try {
      conn = new McpConnection(buildConfigFromParams(params));
      await conn.connect();
      const result = await new SchemaValidator().validate(conn);
      const hasErrors = result.issues.some((i) => i.severity === "error");
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        ...(hasErrors ? { isError: true } : {}),
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
