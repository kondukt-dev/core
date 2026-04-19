import type { Command } from "commander";
import chalk from "chalk";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { AgentDocsGenerator } from "../../agent-docs/index.js";
import { formatJson } from "../output/json-output.js";

interface ClaudeMdOptions {
  output?: string;
  stdout?: boolean;
  format?: "pretty" | "json";
}

/**
 * Deprecated alias — forwards to `agent-docs --target claude`.
 * Kept for backwards compatibility with v0.1 users who ran `kondukt claudemd`.
 */
export function registerClaudeMdCommand(program: Command): void {
  program
    .command("claudemd")
    .description("(Deprecated) Alias for `kondukt agent-docs --target claude`")
    .argument("[path]", "project root (default: current directory)", process.cwd())
    .option("--output <file>", "write to a specific file (default: <path>/CLAUDE.md)")
    .option("--stdout", "print to stdout instead of writing a file")
    .option("--format <fmt>", "output format: pretty | json", "pretty")
    .action(async (path: string, opts: ClaudeMdOptions) => {
      process.stderr.write(
        chalk.yellow(
          "warning: `kondukt claudemd` is deprecated, use `kondukt agent-docs --target claude`\n",
        ),
      );
      const projectPath = resolve(path);
      const result = await new AgentDocsGenerator().generate({
        projectPath,
        target: "claude",
      });

      if (opts.format === "json") {
        const payload = formatJson({ content: result.content, analysis: result.analysis });
        if (opts.stdout) {
          process.stdout.write(payload + "\n");
        } else {
          const dest = opts.output ?? result.outputPath;
          writeFileSync(dest, payload);
          process.stdout.write(chalk.green("✓") + ` Wrote ${dest}\n`);
        }
        return;
      }

      if (opts.stdout) {
        process.stdout.write(result.content);
        return;
      }

      const dest = opts.output ?? result.outputPath;
      writeFileSync(dest, result.content);
      process.stdout.write(chalk.green("✓") + ` Wrote ${dest}\n`);
    });
}
