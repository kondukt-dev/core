import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

import { buildAuthHeaders } from "./auth.js";
import type { ServerConfig } from "./types.js";

export function createTransport(config: ServerConfig): Transport {
  if (config.type === "stdio") {
    return new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: config.env as Record<string, string> | undefined,
      cwd: config.cwd,
    });
  }
  const headers = buildAuthHeaders(config.auth);
  return new StreamableHTTPClientTransport(new URL(config.url), {
    requestInit: { headers },
  });
}
