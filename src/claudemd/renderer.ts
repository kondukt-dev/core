import type { ProjectAnalysis } from "./types.js";

export function renderClaudeMd(analysis: ProjectAnalysis): string {
  const sections: string[] = [];
  sections.push(renderTitle(analysis));
  sections.push(renderProjectOverview(analysis));
  const commands = renderCommands(analysis);
  if (commands) sections.push(commands);
  const architecture = renderArchitecture(analysis);
  if (architecture) sections.push(architecture);
  const keyFiles = renderKeyFiles(analysis);
  if (keyFiles) sections.push(keyFiles);
  const conventions = renderConventions(analysis);
  if (conventions) sections.push(conventions);
  return sections.filter(Boolean).join("\n\n") + "\n";
}

function renderTitle(a: ProjectAnalysis): string {
  const name = a.dependencies.packageName ?? "the project";
  const description = a.dependencies.packageDescription;
  return description ? `# ${name}\n\n${description}` : `# ${name}`;
}

function renderProjectOverview(a: ProjectAnalysis): string {
  const lines: string[] = ["## Project overview"];
  lines.push(`- **Language**: ${languageLabel(a)}`);
  lines.push(`- **Runtime**: ${a.dependencies.runtime}`);
  if (a.dependencies.packageManager !== "unknown") {
    lines.push(`- **Package manager**: ${a.dependencies.packageManager}`);
  }
  if (a.patterns.framework) {
    lines.push(`- **Framework**: ${a.patterns.framework}`);
  }
  if (a.patterns.testFramework) {
    lines.push(`- **Test framework**: ${a.patterns.testFramework}`);
  }
  return lines.join("\n");
}

function renderCommands(a: ProjectAnalysis): string | undefined {
  const { commands } = a.scripts;
  if (commands.length === 0) return undefined;
  const lines = ["## Commands", ""];
  const runner = commandRunner(a);
  for (const c of commands) {
    const prefix = `${runner} ${c.name}`;
    const purpose = c.purpose ? ` — ${c.purpose}` : "";
    lines.push(`- \`${prefix}\`${purpose}  \n  _(${c.command})_`);
  }
  return lines.join("\n");
}

function commandRunner(a: ProjectAnalysis): string {
  if (a.dependencies.packageManager === "pnpm") return "pnpm";
  if (a.dependencies.packageManager === "yarn") return "yarn";
  if (a.dependencies.packageManager === "bun") return "bun run";
  if (a.dependencies.language === "python") return "python -m";
  return "npm run";
}

function renderArchitecture(a: ProjectAnalysis): string | undefined {
  if (a.structure.topLevelDirectories.length === 0) return undefined;
  const lines = ["## Architecture", ""];
  for (const dir of a.structure.topLevelDirectories) {
    const purpose = directoryPurpose(dir);
    lines.push(purpose ? `- \`${dir}/\` — ${purpose}` : `- \`${dir}/\``);
  }
  return lines.join("\n");
}

function directoryPurpose(dir: string): string | undefined {
  const map: Record<string, string> = {
    src: "source code",
    app: "Next.js / React app routes",
    pages: "routes (Next.js / Remix)",
    components: "reusable UI components",
    lib: "shared library code",
    utils: "utility helpers",
    hooks: "React hooks",
    tests: "test suite",
    test: "test suite",
    docs: "documentation",
    scripts: "build / maintenance scripts",
    public: "static assets",
    styles: "CSS / Tailwind styles",
    types: "shared TypeScript types",
  };
  return map[dir];
}

function renderKeyFiles(a: ProjectAnalysis): string | undefined {
  const lines: string[] = [];
  for (const f of a.structure.relevantFiles) {
    const purpose = fileNote(f);
    lines.push(purpose ? `- \`${f}\` — ${purpose}` : `- \`${f}\``);
  }
  if (a.structure.hasReadme) lines.push("- `README.md` — project readme");
  if (a.structure.hasLicense) lines.push("- `LICENSE`");
  if (a.structure.hasDockerfile) lines.push("- `Dockerfile`");
  if (a.structure.hasGithubWorkflows) lines.push("- `.github/workflows/` — CI pipelines");
  if (lines.length === 0) return undefined;
  return ["## Key files", "", ...lines].join("\n");
}

function fileNote(name: string): string | undefined {
  const map: Record<string, string> = {
    "package.json": "package manifest",
    "pyproject.toml": "Python project manifest",
    "tsconfig.json": "TypeScript config",
    "tsup.config.ts": "bundler config",
    "vitest.config.ts": "test runner config",
    "eslint.config.js": "ESLint flat config",
    ".prettierrc.json": "Prettier config",
    "pnpm-lock.yaml": "pnpm lockfile",
    "docker-compose.yml": "Docker Compose services",
  };
  return map[name];
}

function renderConventions(a: ProjectAnalysis): string | undefined {
  const lines: string[] = [];
  if (a.patterns.testFramework) lines.push(`- **Test framework**: ${a.patterns.testFramework}`);
  if (a.patterns.linter) lines.push(`- **Linter**: ${a.patterns.linter}`);
  if (a.patterns.formatter) lines.push(`- **Formatter**: ${a.patterns.formatter}`);
  if (a.patterns.orm) lines.push(`- **ORM**: ${a.patterns.orm}`);
  if (a.patterns.stateManagement)
    lines.push(`- **State management**: ${a.patterns.stateManagement}`);
  if (a.patterns.typescriptStrict) lines.push("- **TypeScript strict mode**: enabled");
  if (a.dependencies.esm) lines.push('- **Module format**: ESM (`"type": "module"`)');
  if (lines.length === 0) return undefined;
  return ["## Conventions", "", ...lines].join("\n");
}

function languageLabel(a: ProjectAnalysis): string {
  if (a.dependencies.language === "typescript") {
    return a.dependencies.esm ? "TypeScript (ESM)" : "TypeScript";
  }
  if (a.dependencies.language === "javascript") {
    return a.dependencies.esm ? "JavaScript (ESM)" : "JavaScript";
  }
  if (a.dependencies.language === "python") return "Python";
  return "unknown";
}
