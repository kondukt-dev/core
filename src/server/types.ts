export interface ToolHandlerResult {
  content: Array<
    | { type: "text"; text: string }
    | { type: "image"; data: string; mimeType: string }
    | { type: "resource"; uri: string; text?: string; mimeType?: string }
  >;
  isError?: boolean;
}

export interface ToolDef {
  definition: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  };
  handler: (params: Record<string, unknown>) => Promise<ToolHandlerResult>;
}
