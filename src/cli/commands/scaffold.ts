import type { Command } from "commander";
import chalk from "chalk";

import { ScaffoldGenerator, parseToolSpec } from "../../scaffold/index.js";
import type { ScaffoldConfig, ScaffoldTool, TemplateName } from "../../scaffold/index.js";
import { formatJson } from "../output/json-output.js";

interface ScaffoldOptions {
  template: string;
  outputDir?: string;
  description?: string;
  tool?: string[];
  format?: "pretty" | "json";
}

export function registerScaffoldCommand(program: Command): void {
  program
    .command("scaffold")
    .description("Generate a new MCP server project from a template")
    .argument("<name>", "project name (used for directory and package name)")
    .requiredOption("--template <t>", "template: typescript | python")
    .option("--output-dir <dir>", "parent directory for the generated project", process.cwd())
    .option("--description <text>", "project description")
    .option(
      "--tool <spec>",
      "tool spec 'name:description[:param:type,...]' (repeatable)",
      (v, acc: string[]) => [...acc, v],
      [] as string[],
    )
    .option("--format <fmt>", "output format: pretty | json", "pretty")
    .action(async (name: string, opts: ScaffoldOptions) => {
      const template = opts.template as TemplateName;
      if (template !== "typescript" && template !== "python") {
        throw new Error(`Unsupported --template '${opts.template}' (use 'typescript' or 'python')`);
      }
      const tools: ScaffoldTool[] = (opts.tool ?? []).map((s) => parseToolSpec(s));
      const cfg: ScaffoldConfig = {
        name,
        template,
        tools,
        outputDir: opts.outputDir ?? process.cwd(),
        ...(opts.description !== undefined ? { description: opts.description } : {}),
      };
      const result = await new ScaffoldGenerator().generate(cfg);
      if (opts.format === "json") {
        process.stdout.write(formatJson(result) + "\n");
        return;
      }
      process.stdout.write(
        chalk.green.bold("✓") + ` Generated ${chalk.bold(name)} (${template})\n`,
      );
      process.stdout.write(chalk.dim(`  ${result.outputDir}`) + "\n\n");
      process.stdout.write(chalk.bold("Files:") + "\n");
      for (const f of result.files) process.stdout.write(`  ${f}\n`);
      process.stdout.write("\n" + chalk.bold("Next steps:") + "\n");
      for (const step of result.nextSteps) {
        process.stdout.write(`  ${chalk.cyan("$")} ${step}\n`);
      }
    });
}
