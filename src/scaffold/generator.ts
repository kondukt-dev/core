import Handlebars from "handlebars";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { ScaffoldConfig, ScaffoldResult, ScaffoldTool } from "./types.js";

const SELF_DIR = dirname(fileURLToPath(import.meta.url));
// Templates live in src/scaffold/templates at dev time and dist/scaffold/templates after build.
// When tsup bundles the CLI entry, scaffold code runs with SELF_DIR = dist/cli/, so we also
// look one level up in a sibling scaffold/templates directory.
const TEMPLATE_ROOTS = [
  resolve(SELF_DIR, "templates"),
  resolve(SELF_DIR, "..", "scaffold", "templates"),
];

function resolveTemplateDir(template: string): string | null {
  for (const root of TEMPLATE_ROOTS) {
    const dir = join(root, template);
    if (existsSync(dir)) return dir;
  }
  return null;
}

export class ScaffoldGenerator {
  async generate(config: ScaffoldConfig): Promise<ScaffoldResult> {
    const templateDir = resolveTemplateDir(config.template);
    if (!templateDir) {
      throw new Error(
        `Template '${config.template}' not found (looked in: ${TEMPLATE_ROOTS.join(", ")})`,
      );
    }

    const outputRoot = join(config.outputDir, config.name);
    mkdirSync(outputRoot, { recursive: true });

    const hb = makeHb();
    const ctx = buildContext(config);
    const files = renderTree(hb, templateDir, outputRoot, ctx);

    return {
      outputDir: outputRoot,
      files: files.sort(),
      nextSteps: buildNextSteps(config),
    };
  }
}

function makeHb(): typeof Handlebars {
  const hb = Handlebars.create();
  hb.registerHelper("json", (value: unknown) => new hb.SafeString(JSON.stringify(value)));
  hb.registerHelper("snake", (value: unknown) => toSnake(String(value ?? "")));
  hb.registerHelper("pascal", (value: unknown) => toPascal(String(value ?? "")));
  hb.registerHelper("pyType", (type: unknown) => jsonTypeToPython(String(type ?? "")));
  hb.registerHelper("inputSchemaOf", (tool: ScaffoldTool) => buildInputSchema(tool));
  return hb as unknown as typeof Handlebars;
}

function buildContext(config: ScaffoldConfig): Record<string, unknown> {
  return {
    name: config.name,
    description: config.description ?? "MCP server generated with Kondukt.",
    tools: config.tools,
  };
}

function renderTree(
  hb: typeof Handlebars,
  templateDir: string,
  outputRoot: string,
  ctx: Record<string, unknown>,
): string[] {
  const out: string[] = [];
  walkTemplates(templateDir).forEach((rel) => {
    const srcPath = join(templateDir, rel);
    const raw = readFileSync(srcPath, "utf8");
    const rendered = hb.compile(raw, { noEscape: false, strict: false })(ctx);
    const destRel = mapPath(rel);
    const destPath = join(outputRoot, destRel);
    mkdirSync(dirname(destPath), { recursive: true });
    writeFileSync(destPath, rendered);
    out.push(destRel);
  });
  return out;
}

function walkTemplates(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".hbs")) out.push(relative(root, full));
    }
  };
  walk(root);
  return out;
}

function mapPath(rel: string): string {
  let out = rel.replace(/\.hbs$/, "");
  out = out.replace(/(^|\/)gitignore$/, "$1.gitignore");
  out = out.replace(/^github\//, ".github/");
  out = out.replace(/\/github\//g, "/.github/");
  return out;
}

function buildInputSchema(tool: ScaffoldTool): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const [name, def] of Object.entries(tool.parameters)) {
    properties[name] = { type: def.type, description: def.description };
    if (def.required !== false) required.push(name);
  }
  const schema: Record<string, unknown> = { type: "object", properties };
  if (required.length > 0) schema.required = required;
  return schema;
}

function jsonTypeToPython(type: string): string {
  switch (type) {
    case "string":
      return "str";
    case "number":
      return "float";
    case "integer":
      return "int";
    case "boolean":
      return "bool";
    case "array":
      return "list";
    case "object":
      return "dict";
    default:
      return "str";
  }
}

function toSnake(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase();
}

function toPascal(s: string): string {
  return s
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

function buildNextSteps(config: ScaffoldConfig): string[] {
  if (config.template === "typescript") {
    return [
      `cd ${config.name}`,
      "pnpm install",
      "pnpm build",
      "npx kondukt test 'node dist/index.js'",
    ];
  }
  return [
    `cd ${config.name}`,
    "python -m venv .venv && source .venv/bin/activate",
    'pip install -e ".[cli]"',
    "npx kondukt test 'python -m src.server'",
  ];
}
