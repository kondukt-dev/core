import type { Command } from "commander";

import { McpConnection } from "../../client/index.js";
import { buildConfigFromCli, commonConnectOptions } from "../connect-options.js";
import type { CliConnectOptions } from "../connect-options.js";
import { renderServerInfo } from "../output/formatter.js";
import { formatJson } from "../output/json-output.js";

export function registerTestCommand(program: Command): void {
  const cmd = program
    .command("test")
    .description("Connect to an MCP server and print its capabilities")
    .passThroughOptions()
    .argument("[cmd...]", "command to spawn a stdio MCP server")
    .action(async (args: string[], opts: CliConnectOptions) => {
      const cfg = buildConfigFromCli(args, opts);
      const conn = new McpConnection(cfg);
      try {
        const info = await conn.connect();
        if (opts.format === "json") {
          process.stdout.write(formatJson(info) + "\n");
        } else {
          process.stdout.write(renderServerInfo(info) + "\n");
        }
      } finally {
        await conn.disconnect().catch(() => undefined);
      }
    });
  commonConnectOptions(cmd);
}
