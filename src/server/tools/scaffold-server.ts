import type { ToolDef, ToolHandlerResult } from "../types.js";

export const scaffoldServerTool: ToolDef = {
  definition: {
    name: "scaffold_server",
    description:
      "Generate a new MCP server project from a template. " +
      "(Returns 'not yet implemented' until Phase 4.)",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        template: { type: "string", enum: ["typescript", "python"] },
      },
    },
  },
  handler: async (): Promise<ToolHandlerResult> => ({
    content: [{ type: "text", text: "scaffold_server is not yet implemented (Phase 4)." }],
    isError: true,
  }),
};
