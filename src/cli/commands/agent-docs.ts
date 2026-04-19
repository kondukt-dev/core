import type { Command } from "commander";
import chalk from "chalk";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { AgentDocsGenerator } from "../../agent-docs/index.js";
import type { AgentDocsResult, AgentTarget } from "../../agent-docs/index.js";
import { AGENT_TARGETS, AGENT_TARGET_FILENAMES } from "../../agent-docs/index.js";
import { formatJson } from "../output/json-output.js";

interface AgentDocsOptions {
  target?: string;
  all?: boolean;
  output?: string;
  stdout?: boolean;
  format?: "pretty" | "json";
}

export function registerAgentDocsCommand(program: Command): void {
  program
    .command("agent-docs")
    .description(
      "Analyze a project and generate a context file for an AI coding tool (CLAUDE.md / AGENTS.md / GEMINI.md)",
    )
    .argument("[path]", "project root (default: current directory)", process.cwd())
    .option("--target <t>", "target tool: claude | codex | gemini (default: claude)", "claude")
    .option("--all", "generate for all targets (writes CLAUDE.md, AGENTS.md, GEMINI.md)")
    .option("--output <file>", "write to a specific file (ignored with --all)")
    .option("--stdout", "print to stdout instead of writing a file")
    .option("--format <fmt>", "output format: pretty | json", "pretty")
    .action(async (path: string, opts: AgentDocsOptions) => {
      const projectPath = resolve(path);

      if (opts.all) {
        if (opts.output) {
          throw new Error("--output cannot be combined with --all");
        }
        const results: AgentDocsResult[] = [];
        for (const target of AGENT_TARGETS) {
          const r = await new AgentDocsGenerator().generate({ projectPath, target });
          results.push(r);
        }
        if (opts.format === "json") {
          const payload = formatJson(
            results.map((r) => ({ target: r.target, content: r.content, analysis: r.analysis })),
          );
          if (opts.stdout) {
            process.stdout.write(payload + "\n");
          } else {
            for (const r of results) writeFileSync(r.outputPath, r.content);
            process.stdout.write(
              chalk.green("✓") +
                ` Wrote ${results.map((r) => AGENT_TARGET_FILENAMES[r.target]).join(", ")}\n`,
            );
          }
          return;
        }
        if (opts.stdout) {
          // Concatenate with separators when printing multiple targets.
          for (const r of results) {
            process.stdout.write(chalk.dim(`--- ${AGENT_TARGET_FILENAMES[r.target]} ---\n`));
            process.stdout.write(r.content + "\n");
          }
          return;
        }
        for (const r of results) writeFileSync(r.outputPath, r.content);
        for (const r of results) {
          process.stdout.write(chalk.green("✓") + ` Wrote ${r.outputPath}\n`);
        }
        return;
      }

      const target = normalizeTarget(opts.target ?? "claude");
      const result = await new AgentDocsGenerator().generate({ projectPath, target });

      if (opts.format === "json") {
        const payload = formatJson({
          target: result.target,
          content: result.content,
          analysis: result.analysis,
        });
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

function normalizeTarget(raw: string): AgentTarget {
  const t = raw.toLowerCase();
  if (t === "claude" || t === "codex" || t === "gemini") return t;
  throw new Error(`Unsupported --target '${raw}' (use claude | codex | gemini)`);
}
