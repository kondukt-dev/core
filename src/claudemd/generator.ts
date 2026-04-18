import { join } from "node:path";

import { runAllAnalyzers } from "./analyze.js";
import { renderClaudeMd } from "./renderer.js";
import type { ClaudeMdConfig, ClaudeMdResult } from "./types.js";

export class ClaudeMdGenerator {
  async generate(config: ClaudeMdConfig): Promise<ClaudeMdResult> {
    const analysis = runAllAnalyzers(config.projectPath);
    const content = renderClaudeMd(analysis);
    const outputPath = config.outputPath ?? join(config.projectPath, "CLAUDE.md");
    return { content, outputPath, analysis };
  }
}
