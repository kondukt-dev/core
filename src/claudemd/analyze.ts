import { analyzeDependencies } from "./analyzers/dependencies.js";
import { analyzePatterns } from "./analyzers/patterns.js";
import { analyzeScripts } from "./analyzers/scripts.js";
import { analyzeStructure } from "./analyzers/structure.js";
import type { ProjectAnalysis } from "./types.js";

export function runAllAnalyzers(projectPath: string): ProjectAnalysis {
  const dependencies = analyzeDependencies(projectPath);
  const structure = analyzeStructure(projectPath);
  const scripts = analyzeScripts(projectPath);
  const patterns = analyzePatterns(projectPath, dependencies, structure);
  return { projectPath, dependencies, structure, scripts, patterns };
}
