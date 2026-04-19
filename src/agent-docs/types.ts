export type Language = "typescript" | "javascript" | "python" | "unknown";
export type PackageManager = "pnpm" | "yarn" | "npm" | "bun" | "pip" | "uv" | "unknown";

/**
 * Which AI-coding tool this context document targets.
 * - `claude` → writes `CLAUDE.md`
 * - `codex`  → writes `AGENTS.md` (also the de-facto cross-tool standard)
 * - `gemini` → writes `GEMINI.md`
 */
export type AgentTarget = "claude" | "codex" | "gemini";

export const AGENT_TARGETS: readonly AgentTarget[] = ["claude", "codex", "gemini"] as const;

export const AGENT_TARGET_FILENAMES: Record<AgentTarget, string> = {
  claude: "CLAUDE.md",
  codex: "AGENTS.md",
  gemini: "GEMINI.md",
};

export const AGENT_TARGET_LABELS: Record<AgentTarget, string> = {
  claude: "Claude Code",
  codex: "Codex (and any tool that reads AGENTS.md)",
  gemini: "Gemini CLI",
};

export interface DependencyFacts {
  language: Language;
  packageManager: PackageManager;
  runtime: string;
  packageName?: string;
  packageVersion?: string;
  packageDescription?: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  esm: boolean;
}

export interface StructureFacts {
  topLevelDirectories: string[];
  hasReadme: boolean;
  hasLicense: boolean;
  hasDockerfile: boolean;
  hasGithubWorkflows: boolean;
  relevantFiles: string[];
}

export interface ScriptFacts {
  commands: Array<{ name: string; command: string; purpose?: string }>;
  entryPoints: string[];
}

export interface PatternFacts {
  framework?: string;
  orm?: string;
  stateManagement?: string;
  testFramework?: string;
  linter?: string;
  formatter?: string;
  typescriptStrict?: boolean;
}

export interface ProjectAnalysis {
  projectPath: string;
  dependencies: DependencyFacts;
  structure: StructureFacts;
  scripts: ScriptFacts;
  patterns: PatternFacts;
}

export interface AgentDocsConfig {
  projectPath: string;
  /** Which tool the output is for (affects filename + first-line header). Defaults to "claude". */
  target?: AgentTarget;
  outputPath?: string;
}

export interface AgentDocsResult {
  content: string;
  outputPath: string;
  target: AgentTarget;
  analysis: ProjectAnalysis;
}

/** @deprecated use AgentDocsConfig */
export type ClaudeMdConfig = AgentDocsConfig;

/** @deprecated use AgentDocsResult */
export type ClaudeMdResult = AgentDocsResult;
