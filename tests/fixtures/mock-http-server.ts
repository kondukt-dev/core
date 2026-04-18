import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

export async function startMockHttpServer(): Promise<{ url: string; close: () => Promise<void> }> {
  const mcp = new Server(
    { name: "mock-http-server", version: "0.0.0" },
    { capabilities: { tools: {} } },
  );

  mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "echo",
        description: "Return the text argument back",
        inputSchema: {
          type: "object",
          properties: { text: { type: "string" } },
          required: ["text"],
        },
      },
    ],
  }));

  mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
    const text = String((req.params.arguments as { text?: unknown } | undefined)?.text ?? "");
    return { content: [{ type: "text", text }] };
  });

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });
  await mcp.connect(transport);

  const http = createServer(async (req, res) => {
    if (!req.url?.startsWith("/mcp")) {
      res.statusCode = 404;
      res.end();
      return;
    }
    if (req.headers["authorization"] !== "Bearer test-token") {
      res.statusCode = 401;
      res.end("unauthorized");
      return;
    }
    await transport.handleRequest(req, res);
  });

  await new Promise<void>((resolve) => http.listen(0, "127.0.0.1", resolve));
  const address = http.address();
  if (!address || typeof address === "string") throw new Error("bad address");
  const url = `http://127.0.0.1:${address.port}/mcp`;

  return {
    url,
    close: async () => {
      await new Promise<void>((resolve) => http.close(() => resolve()));
    },
  };
}
