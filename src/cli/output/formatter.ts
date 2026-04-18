import chalk from "chalk";
import Table from "cli-table3";

import type { Prompt, Resource, ServerInfo, Tool, ToolResult } from "../../client/types.js";

export function renderServerInfo(info: ServerInfo): string {
  const lines = [
    chalk.bold(`${info.name} v${info.version}`),
    chalk.dim(`protocol ${info.protocolVersion}`),
    "",
    `Tools:     ${chalk.cyan(info.toolCount)}` +
      (info.capabilities.tools ? "" : chalk.dim(" (not advertised)")),
    `Resources: ${chalk.cyan(info.resourceCount)}` +
      (info.capabilities.resources ? "" : chalk.dim(" (not advertised)")),
    `Prompts:   ${chalk.cyan(info.promptCount)}` +
      (info.capabilities.prompts ? "" : chalk.dim(" (not advertised)")),
  ];
  return lines.join("\n");
}

export function renderToolsTable(tools: Tool[]): string {
  if (tools.length === 0) return chalk.dim("(no tools)");
  const t = new Table({
    head: [chalk.bold("Name"), chalk.bold("Description")],
    colWidths: [28, 60],
    wordWrap: true,
  });
  for (const tool of tools) {
    t.push([chalk.cyan(tool.name), tool.description ?? chalk.dim("(no description)")]);
  }
  return t.toString();
}

export function renderResourcesTable(resources: Resource[]): string {
  if (resources.length === 0) return chalk.dim("(no resources)");
  const t = new Table({
    head: [chalk.bold("URI"), chalk.bold("Name"), chalk.bold("MIME")],
    colWidths: [40, 24, 20],
    wordWrap: true,
  });
  for (const r of resources) {
    t.push([chalk.cyan(r.uri), r.name, r.mimeType ?? chalk.dim("—")]);
  }
  return t.toString();
}

export function renderPromptsTable(prompts: Prompt[]): string {
  if (prompts.length === 0) return chalk.dim("(no prompts)");
  const t = new Table({
    head: [chalk.bold("Name"), chalk.bold("Args"), chalk.bold("Description")],
    colWidths: [24, 24, 40],
    wordWrap: true,
  });
  for (const p of prompts) {
    const args = (p.arguments ?? []).map((a) => a.name + (a.required ? "*" : "")).join(", ");
    t.push([chalk.cyan(p.name), args, p.description ?? chalk.dim("(no description)")]);
  }
  return t.toString();
}

export function renderToolResult(result: ToolResult): string {
  const header = result.isError ? chalk.red.bold("ERROR") : chalk.green.bold("OK");
  const timing = chalk.dim(`(${result.timing.durationMs}ms)`);
  const body = result.content
    .map((c) => {
      if (c.type === "text") return c.text;
      if (c.type === "image") return chalk.dim(`[image: ${c.mimeType}]`);
      return chalk.dim(`[resource: ${c.uri}]`);
    })
    .join("\n");
  return `${header} ${timing}\n${body}`;
}

export function renderToolDetail(tool: Tool): string {
  return [
    chalk.bold.cyan(tool.name),
    tool.description ? chalk.dim(tool.description) : chalk.dim("(no description)"),
    "",
    chalk.bold("inputSchema:"),
    JSON.stringify(tool.inputSchema, null, 2),
  ].join("\n");
}
