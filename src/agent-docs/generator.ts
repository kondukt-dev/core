import { join } from "node:path";

import { runAllAnalyzers } from "./analyze.js";
import { renderAgentDocs } from "./renderer.js";
import { AGENT_TARGET_FILENAMES } from "./types.js";
import type { AgentDocsConfig, AgentDocsResult } from "./types.js";

export class AgentDocsGenerator {
  async generate(config: AgentDocsConfig): Promise<AgentDocsResult> {
    const target = config.target ?? "claude";
    const analysis = runAllAnalyzers(config.projectPath);
    const content = renderAgentDocs(analysis, target);
    const outputPath =
      config.outputPath ?? join(config.projectPath, AGENT_TARGET_FILENAMES[target]);
    return { content, outputPath, target, analysis };
  }
}

/** @deprecated use AgentDocsGenerator */
export class ClaudeMdGenerator extends AgentDocsGenerator {}
