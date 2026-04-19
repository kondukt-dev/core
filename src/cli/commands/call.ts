import type { Command } from "commander";

import { McpConnection } from "../../client/index.js";
import { buildConfigFromCli, commonConnectOptions } from "../connect-options.js";
import type { CliConnectOptions } from "../connect-options.js";
import { renderToolResult } from "../output/formatter.js";
import { formatJson } from "../output/json-output.js";

interface CallOptions extends CliConnectOptions {
  tool: string;
  args?: string;
}

export function registerCallCommand(program: Command): void {
  const cmd = program
    .command("call")
    .description("Call a tool on the target MCP server")
    .requiredOption("--tool <name>", "name of the tool to call")
    .option("--args <json>", "JSON arguments to pass to the tool", "{}")
    .passThroughOptions()
    .argument("[cmd...]", "command to spawn a stdio MCP server")
    .action(async (args: string[], opts: CallOptions) => {
      let parsedArgs: Record<string, unknown>;
      try {
        parsedArgs = opts.args ? (JSON.parse(opts.args) as Record<string, unknown>) : {};
      } catch (err) {
        throw new Error(`--args must be valid JSON: ${(err as Error).message}`);
      }

      const cfg = buildConfigFromCli(args, opts);
      const conn = new McpConnection(cfg);
      try {
        await conn.connect();
        const result = await conn.callTool(opts.tool, parsedArgs);
        if (opts.format === "json") {
          process.stdout.write(formatJson(result) + "\n");
        } else {
          process.stdout.write(renderToolResult(result) + "\n");
        }
        if (result.isError) process.exitCode = 1;
      } finally {
        await conn.disconnect().catch(() => undefined);
      }
    });
  commonConnectOptions(cmd);
}
