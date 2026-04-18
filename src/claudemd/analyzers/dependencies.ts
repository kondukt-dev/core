import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { DependencyFacts, Language, PackageManager } from "../types.js";

export function analyzeDependencies(projectPath: string): DependencyFacts {
  const base: DependencyFacts = {
    language: "unknown",
    packageManager: detectPackageManager(projectPath),
    runtime: "unknown",
    dependencies: {},
    devDependencies: {},
    esm: false,
  };

  const pkgPath = join(projectPath, "package.json");
  if (existsSync(pkgPath)) {
    const pkg = safeReadJson(pkgPath);
    if (pkg) {
      return {
        ...base,
        language: inferNodeLanguage(pkg, projectPath),
        runtime: formatNodeRuntime(pkg),
        ...(pkg.name !== undefined ? { packageName: String(pkg.name) } : {}),
        ...(pkg.version !== undefined ? { packageVersion: String(pkg.version) } : {}),
        ...(pkg.description !== undefined ? { packageDescription: String(pkg.description) } : {}),
        dependencies: toRecord(pkg.dependencies),
        devDependencies: toRecord(pkg.devDependencies),
        esm: pkg.type === "module",
      };
    }
  }

  const pyprojectPath = join(projectPath, "pyproject.toml");
  if (existsSync(pyprojectPath)) {
    const toml = readFileSync(pyprojectPath, "utf8");
    return analyzePyproject(toml, base);
  }

  return base;
}

function detectPackageManager(projectPath: string): PackageManager {
  if (existsSync(join(projectPath, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(projectPath, "yarn.lock"))) return "yarn";
  if (existsSync(join(projectPath, "bun.lockb"))) return "bun";
  if (existsSync(join(projectPath, "package-lock.json"))) return "npm";
  if (existsSync(join(projectPath, "uv.lock"))) return "uv";
  if (existsSync(join(projectPath, "requirements.txt"))) return "pip";
  return "unknown";
}

function inferNodeLanguage(pkg: Record<string, unknown>, projectPath: string): Language {
  if (existsSync(join(projectPath, "tsconfig.json"))) return "typescript";
  const deps = { ...toRecord(pkg.dependencies), ...toRecord(pkg.devDependencies) };
  if (deps["typescript"]) return "typescript";
  return "javascript";
}

function formatNodeRuntime(pkg: Record<string, unknown>): string {
  const engines = pkg.engines as Record<string, unknown> | undefined;
  const nodeRange = engines && typeof engines.node === "string" ? engines.node : ">=18";
  return `Node.js ${nodeRange}`;
}

function safeReadJson(path: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function toRecord(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

function analyzePyproject(toml: string, base: DependencyFacts): DependencyFacts {
  const projectName = matchFirst(toml, /^\s*name\s*=\s*"([^"]+)"/m);
  const projectVersion = matchFirst(toml, /^\s*version\s*=\s*"([^"]+)"/m);
  const projectDescription = matchFirst(toml, /^\s*description\s*=\s*"([^"]+)"/m);
  const pythonRange = matchFirst(toml, /^\s*requires-python\s*=\s*"([^"]+)"/m);

  return {
    ...base,
    language: "python",
    runtime: pythonRange ? `Python ${pythonRange}` : "Python",
    ...(projectName !== undefined ? { packageName: projectName } : {}),
    ...(projectVersion !== undefined ? { packageVersion: projectVersion } : {}),
    ...(projectDescription !== undefined ? { packageDescription: projectDescription } : {}),
    dependencies: parsePyDependencies(toml, "dependencies"),
    devDependencies: parsePyOptionalDependencies(toml, "dev"),
  };
}

function parsePyDependencies(toml: string, key: string): Record<string, string> {
  const block = new RegExp(`^\\s*${key}\\s*=\\s*\\[([\\s\\S]*?)\\]`, "m").exec(toml);
  if (!block || !block[1]) return {};
  return parsePyItems(block[1]);
}

function parsePyOptionalDependencies(toml: string, group: string): Record<string, string> {
  const section = /\[project\.optional-dependencies\]([\s\S]*?)(?=\n\[|$)/.exec(toml);
  if (!section || !section[1]) return {};
  const block = new RegExp(`^\\s*${group}\\s*=\\s*\\[([\\s\\S]*?)\\]`, "m").exec(section[1]);
  if (!block || !block[1]) return {};
  return parsePyItems(block[1]);
}

function parsePyItems(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of raw.matchAll(/"([^"]+)"/g)) {
    const item = (m[1] ?? "").trim();
    if (!item) continue;
    const [name, ...rest] = item.split(/[<>=!~]/);
    if (!name) continue;
    const version = rest.length > 0 ? item.slice(name.length) : "*";
    out[name.trim()] = version.trim();
  }
  return out;
}

function matchFirst(source: string, re: RegExp): string | undefined {
  const m = re.exec(source);
  return m?.[1];
}
