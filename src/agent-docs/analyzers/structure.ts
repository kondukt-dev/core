import { existsSync, readdirSync, statSync, type Stats } from "node:fs";
import { join } from "node:path";

import type { StructureFacts } from "../types.js";

const RELEVANT_FILES = new Set([
  "package.json",
  "pnpm-lock.yaml",
  "pyproject.toml",
  "requirements.txt",
  "tsconfig.json",
  "tsup.config.ts",
  "vitest.config.ts",
  "eslint.config.js",
  ".prettierrc",
  ".prettierrc.json",
  ".gitignore",
  ".dockerignore",
  "docker-compose.yml",
  "Makefile",
]);

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  "__pycache__",
  ".venv",
  "venv",
  ".next",
  ".turbo",
]);

export function analyzeStructure(projectPath: string): StructureFacts {
  const entries = safeReaddir(projectPath);
  const topLevelDirectories: string[] = [];
  const relevantFiles: string[] = [];

  for (const entry of entries) {
    const full = join(projectPath, entry);
    const stat = safeStat(full);
    if (!stat) continue;
    if (stat.isDirectory()) {
      if (SKIP_DIRS.has(entry) || entry.startsWith(".")) continue;
      topLevelDirectories.push(entry);
    } else if (stat.isFile()) {
      if (RELEVANT_FILES.has(entry)) relevantFiles.push(entry);
    }
  }

  return {
    topLevelDirectories: topLevelDirectories.sort(),
    hasReadme: hasFileInsensitive(projectPath, "README.md"),
    hasLicense: hasFileInsensitive(projectPath, "LICENSE"),
    hasDockerfile: existsSync(join(projectPath, "Dockerfile")),
    hasGithubWorkflows: existsSync(join(projectPath, ".github", "workflows")),
    relevantFiles: relevantFiles.sort(),
  };
}

function safeReaddir(path: string): string[] {
  try {
    return readdirSync(path);
  } catch {
    return [];
  }
}

function safeStat(path: string): Stats | undefined {
  try {
    return statSync(path);
  } catch {
    return undefined;
  }
}

function hasFileInsensitive(dir: string, name: string): boolean {
  const want = name.toLowerCase();
  return safeReaddir(dir).some((e) => e.toLowerCase() === want);
}
