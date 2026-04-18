import type { Command } from "commander";

import { McpConnection } from "../../client/index.js";
import { buildConfigFromCli, commonConnectOptions } from "../connect-options.js";
import type { CliConnectOptions } from "../connect-options.js";
import {
  renderPromptsTable,
  renderResourcesTable,
  renderToolDetail,
  renderToolsTable,
} from "../output/formatter.js";
import { formatJson } from "../output/json-output.js";

interface InspectOptions extends CliConnectOptions {
  tools?: boolean;
  resources?: boolean;
  prompts?: boolean;
  tool?: string;
}

export function registerInspectCommand(program: Command): void {
  const cmd = program
    .command("inspect")
    .description("Inspect an MCP server's tools, resources, or prompts")
    .passThroughOptions()
    .argument("[cmd...]", "command to spawn a stdio MCP server")
    .option("--tools", "show only tools")
    .option("--resources", "show only resources")
    .option("--prompts", "show only prompts")
    .option("--tool <name>", "show detailed schema for a single tool")
    .action(async (args: string[], opts: InspectOptions) => {
      const cfg = buildConfigFromCli(args, opts);
      const conn = new McpConnection(cfg);
      try {
        await conn.connect();
        const [tools, resources, prompts] = await Promise.all([
          conn.listTools(),
          conn.listResources().catch(() => []),
          conn.listPrompts().catch(() => []),
        ]);

        if (opts.tool) {
          const target = tools.find((t) => t.name === opts.tool);
          if (!target) {
            process.stderr.write(`No tool named ${opts.tool}\n`);
            process.exitCode = 1;
            return;
          }
          if (opts.format === "json") {
            process.stdout.write(formatJson(target) + "\n");
          } else {
            process.stdout.write(renderToolDetail(target) + "\n");
          }
          return;
        }

        if (opts.format === "json") {
          const out: Record<string, unknown> = {};
          if (!opts.resources && !opts.prompts) out.tools = tools;
          if (!opts.tools && !opts.prompts) out.resources = resources;
          if (!opts.tools && !opts.resources) out.prompts = prompts;
          process.stdout.write(formatJson(out) + "\n");
          return;
        }

        const sections: string[] = [];
        if (!opts.resources && !opts.prompts) sections.push("Tools:\n" + renderToolsTable(tools));
        if (!opts.tools && !opts.prompts)
          sections.push("Resources:\n" + renderResourcesTable(resources));
        if (!opts.tools && !opts.resources)
          sections.push("Prompts:\n" + renderPromptsTable(prompts));
        process.stdout.write(sections.join("\n\n") + "\n");
      } finally {
        await conn.disconnect().catch(() => undefined);
      }
    });
  commonConnectOptions(cmd);
}
