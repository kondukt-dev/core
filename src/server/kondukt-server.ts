import { createServer as createHttpServer } from "node:http";
import { randomUUID } from "node:crypto";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { allTools } from "./tools/index.js";

export interface KonduktServerOptions {
  transport?: "stdio" | "http";
  port?: number;
  host?: string;
}

export interface KonduktServerHandle {
  close: () => Promise<void>;
}

export async function startKonduktServer(
  options: KonduktServerOptions = {},
): Promise<KonduktServerHandle> {
  const server = new Server({ name: "kondukt", version: "0.1.0" }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allTools.map((t) => t.definition),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const tool = allTools.find((t) => t.definition.name === req.params.name);
    if (!tool) {
      return {
        content: [{ type: "text", text: `Unknown tool: ${req.params.name}` }],
        isError: true,
      };
    }
    const result = await tool.handler((req.params.arguments ?? {}) as Record<string, unknown>);
    return result as unknown as { content: typeof result.content; isError?: boolean };
  });

  const transport = options.transport ?? "stdio";

  if (transport === "http") {
    const port = options.port ?? 8080;
    const host = options.host ?? "127.0.0.1";
    const httpTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });
    await server.connect(httpTransport);
    const http = createHttpServer(async (req, res) => {
      if (!req.url?.startsWith("/mcp")) {
        res.statusCode = 404;
        res.end();
        return;
      }
      await httpTransport.handleRequest(req, res);
    });
    await new Promise<void>((resolve) => http.listen(port, host, resolve));
    return {
      close: async () => {
        await new Promise<void>((resolve) => http.close(() => resolve()));
      },
    };
  }

  const stdio = new StdioServerTransport();
  await server.connect(stdio);
  return {
    close: async () => {
      await server.close();
    },
  };
}

const invokedDirectly = (() => {
  const arg1 = process.argv[1];
  if (!arg1) return false;
  if (process.argv.includes("--stdio-autostart")) return true;
  return arg1.endsWith("kondukt-server.ts") || arg1.endsWith("kondukt-server.js");
})();

if (invokedDirectly) {
  await startKonduktServer({ transport: "stdio" });
}
