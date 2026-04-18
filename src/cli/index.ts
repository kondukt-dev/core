#!/usr/bin/env node
import { Command } from "commander";

import { registerCallCommand } from "./commands/call.js";
import { registerClaudeMdCommand } from "./commands/claudemd.js";
import { registerInspectCommand } from "./commands/inspect.js";
import { registerScaffoldCommand } from "./commands/scaffold.js";
import { registerServeCommand } from "./commands/serve.js";
import { registerTestCommand } from "./commands/test.js";
import { registerValidateCommand } from "./commands/validate.js";

const program = new Command();
program
  .name("kondukt")
  .description("MCP DevTools — test, validate, debug, and scaffold MCP servers")
  .version("0.1.0-dev.0")
  .enablePositionalOptions();

registerTestCommand(program);
registerInspectCommand(program);
registerCallCommand(program);
registerValidateCommand(program);
registerScaffoldCommand(program);
registerClaudeMdCommand(program);
registerServeCommand(program);

program.parseAsync().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`kondukt: ${msg}\n`);
  process.exit(1);
});
