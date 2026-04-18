import type { Command } from "commander";

import { McpConnection } from "../../client/index.js";
import { SchemaValidator } from "../../validator/index.js";
import { buildConfigFromCli, commonConnectOptions } from "../connect-options.js";
import type { CliConnectOptions } from "../connect-options.js";
import { formatJson } from "../output/json-output.js";
import { renderValidationReport } from "../output/validation-report.js";

export function registerValidateCommand(program: Command): void {
  const cmd = program
    .command("validate")
    .description("Validate an MCP server against the protocol specification")
    .passThroughOptions()
    .argument("[cmd...]", "command to spawn a stdio MCP server")
    .action(async (args: string[], opts: CliConnectOptions) => {
      const cfg = buildConfigFromCli(args, opts);
      const conn = new McpConnection(cfg);
      try {
        await conn.connect();
        const result = await new SchemaValidator().validate(conn);
        if (opts.format === "json") {
          process.stdout.write(formatJson(result) + "\n");
        } else {
          process.stdout.write(renderValidationReport(result) + "\n");
        }
        if (result.issues.some((i) => i.severity === "error")) {
          process.exitCode = 1;
        }
      } finally {
        await conn.disconnect().catch(() => undefined);
      }
    });
  commonConnectOptions(cmd);
}
