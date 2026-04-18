export type Language = "typescript" | "javascript" | "python" | "unknown";
export type PackageManager = "pnpm" | "yarn" | "npm" | "bun" | "pip" | "uv" | "unknown";

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

export interface ClaudeMdConfig {
  projectPath: string;
  outputPath?: string;
}

export interface ClaudeMdResult {
  content: string;
  outputPath: string;
  analysis: ProjectAnalysis;
}
