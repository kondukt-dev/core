import type { Command } from "commander";
import chalk from "chalk";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { ClaudeMdGenerator } from "../../claudemd/index.js";
import { formatJson } from "../output/json-output.js";

interface ClaudeMdOptions {
  output?: string;
  stdout?: boolean;
  format?: "pretty" | "json";
}

export function registerClaudeMdCommand(program: Command): void {
  program
    .command("claudemd")
    .description("Analyze a project and generate a CLAUDE.md file")
    .argument("[path]", "project root (default: current directory)", process.cwd())
    .option("--output <file>", "write to a specific file (default: <path>/CLAUDE.md)")
    .option("--stdout", "print to stdout instead of writing a file")
    .option("--format <fmt>", "output format: pretty | json", "pretty")
    .action(async (path: string, opts: ClaudeMdOptions) => {
      const projectPath = resolve(path);
      const result = await new ClaudeMdGenerator().generate({ projectPath });

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
