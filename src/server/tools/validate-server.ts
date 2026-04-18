import type { ToolDef, ToolHandlerResult } from "../types.js";

export const validateServerTool: ToolDef = {
  definition: {
    name: "validate_server",
    description:
      "Validate the target MCP server against the protocol specification. " +
      "(Returns 'not yet implemented' until Phase 3.)",
    inputSchema: {
      type: "object",
      properties: {
        command: { type: "string" },
        url: { type: "string" },
      },
    },
  },
  handler: async (): Promise<ToolHandlerResult> => ({
    content: [{ type: "text", text: "validate_server is not yet implemented (Phase 3)." }],
    isError: true,
  }),
};
