import { callToolTool } from "./call-tool.js";
import { getPromptTool } from "./get-prompt.js";
import { listPromptsTool } from "./list-prompts.js";
import { listResourcesTool } from "./list-resources.js";
import { listToolsTool } from "./list-tools.js";
import { readResourceTool } from "./read-resource.js";
import { scaffoldServerTool } from "./scaffold-server.js";
import { testServerTool } from "./test-server.js";
import { validateServerTool } from "./validate-server.js";
import type { ToolDef } from "../types.js";

export const allTools: readonly ToolDef[] = [
  testServerTool,
  listToolsTool,
  callToolTool,
  listResourcesTool,
  readResourceTool,
  listPromptsTool,
  getPromptTool,
  validateServerTool,
  scaffoldServerTool,
] as const;
