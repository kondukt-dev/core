import type { Command } from "commander";

import { startKonduktServer } from "../../server/index.js";

interface ServeOptions {
  http?: boolean;
  port?: string;
  host?: string;
}

export function registerServeCommand(program: Command): void {
  program
    .command("serve")
    .description("Run Kondukt itself as an MCP server (stdio default)")
    .option("--http", "use Streamable HTTP transport instead of stdio")
    .option("--port <port>", "HTTP port (default 8080)")
    .option("--host <host>", "HTTP host (default 127.0.0.1)")
    .action(async (opts: ServeOptions) => {
      const transport = opts.http ? "http" : "stdio";
      const port = opts.port ? Number.parseInt(opts.port, 10) : undefined;
      await startKonduktServer({
        transport,
        ...(port !== undefined ? { port } : {}),
        ...(opts.host !== undefined ? { host: opts.host } : {}),
      });
    });
}
