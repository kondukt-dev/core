import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { ScriptFacts } from "../types.js";

const PURPOSES: Record<string, string> = {
  build: "Build production artifacts",
  dev: "Start development server / watcher",
  start: "Run the built artifact",
  test: "Run the test suite",
  "test:watch": "Run tests in watch mode",
  "test:coverage": "Run tests with coverage",
  lint: "Lint the codebase",
  "lint:fix": "Lint and auto-fix",
  typecheck: "Type-check the TypeScript sources",
  format: "Format the codebase",
};

export function analyzeScripts(projectPath: string): ScriptFacts {
  const pkgPath = join(projectPath, "package.json");
  if (existsSync(pkgPath)) return fromPackageJson(pkgPath);

  const pyprojectPath = join(projectPath, "pyproject.toml");
  if (existsSync(pyprojectPath)) return fromPyproject(pyprojectPath);

  return { commands: [], entryPoints: [] };
}

function fromPackageJson(path: string): ScriptFacts {
  try {
    const pkg = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    const scripts = (pkg.scripts as Record<string, unknown> | undefined) ?? {};
    const commands = Object.entries(scripts)
      .filter(([, cmd]) => typeof cmd === "string")
      .map(([name, cmd]) => {
        const entry: { name: string; command: string; purpose?: string } = {
          name,
          command: String(cmd),
        };
        if (PURPOSES[name] !== undefined) entry.purpose = PURPOSES[name];
        return entry;
      });
    const mainEntry = typeof pkg.main === "string" ? pkg.main : undefined;
    const entryPoints = mainEntry ? [mainEntry] : [];
    return { commands, entryPoints };
  } catch {
    return { commands: [], entryPoints: [] };
  }
}

function fromPyproject(path: string): ScriptFacts {
  const toml = readFileSync(path, "utf8");
  const section = /\[project\.scripts\]([\s\S]*?)(?=\n\[|$)/.exec(toml);
  if (!section?.[1]) return { commands: [], entryPoints: [] };
  const entryPoints: string[] = [];
  for (const line of section[1].split("\n")) {
    const m = /^\s*[\w-]+\s*=\s*"([^"]+)"/.exec(line);
    if (m?.[1]) entryPoints.push(m[1]);
  }
  return { commands: [], entryPoints };
}
