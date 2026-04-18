import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { DependencyFacts, PatternFacts, StructureFacts } from "../types.js";

export function analyzePatterns(
  projectPath: string,
  deps: DependencyFacts,
  structure: StructureFacts,
): PatternFacts {
  const out: PatternFacts = {};
  const allDeps = { ...deps.dependencies, ...deps.devDependencies };

  const framework = detectFramework(allDeps);
  if (framework) out.framework = framework;

  const orm = detectOrm(allDeps);
  if (orm) out.orm = orm;

  const state = detectState(allDeps);
  if (state) out.stateManagement = state;

  const test = detectTestFramework(allDeps);
  if (test) out.testFramework = test;

  if (allDeps["eslint"]) out.linter = "ESLint";
  if (allDeps["prettier"]) out.formatter = "Prettier";
  if (allDeps["ruff"]) out.formatter = out.formatter ?? "Ruff";

  if (deps.language === "typescript") {
    const strict = detectTsStrict(projectPath);
    if (strict !== undefined) out.typescriptStrict = strict;
  }

  void structure;
  return out;
}

function detectFramework(deps: Record<string, string>): string | undefined {
  if (deps["next"]) return "Next.js";
  if (deps["astro"]) return "Astro";
  if (deps["fastify"]) return "Fastify";
  if (deps["express"]) return "Express";
  if (deps["koa"]) return "Koa";
  if (deps["hono"]) return "Hono";
  if (deps["@nestjs/core"]) return "NestJS";
  if (deps["fastapi"]) return "FastAPI";
  if (deps["flask"]) return "Flask";
  if (deps["django"]) return "Django";
  return undefined;
}

function detectOrm(deps: Record<string, string>): string | undefined {
  if (deps["@prisma/client"] || deps["prisma"]) return "Prisma";
  if (deps["drizzle-orm"]) return "Drizzle";
  if (deps["typeorm"]) return "TypeORM";
  if (deps["kysely"]) return "Kysely";
  if (deps["sqlalchemy"]) return "SQLAlchemy";
  if (deps["tortoise-orm"]) return "Tortoise ORM";
  return undefined;
}

function detectState(deps: Record<string, string>): string | undefined {
  if (deps["zustand"]) return "Zustand";
  if (deps["@reduxjs/toolkit"] || deps["redux"]) return "Redux";
  if (deps["mobx"]) return "MobX";
  if (deps["jotai"]) return "Jotai";
  if (deps["recoil"]) return "Recoil";
  return undefined;
}

function detectTestFramework(deps: Record<string, string>): string | undefined {
  if (deps["vitest"]) return "Vitest";
  if (deps["jest"]) return "Jest";
  if (deps["@playwright/test"]) return "Playwright";
  if (deps["pytest"]) return "Pytest";
  return undefined;
}

function detectTsStrict(projectPath: string): boolean | undefined {
  const tsconfigPath = join(projectPath, "tsconfig.json");
  if (!existsSync(tsconfigPath)) return undefined;
  try {
    const raw = readFileSync(tsconfigPath, "utf8");
    const stripped = raw.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    const parsed = JSON.parse(stripped) as Record<string, unknown>;
    const compiler = (parsed.compilerOptions as Record<string, unknown> | undefined) ?? {};
    return compiler.strict === true;
  } catch {
    return undefined;
  }
}
