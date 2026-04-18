# kondukt

> MCP DevTools — test, validate, debug, and scaffold MCP servers.

[![npm version](https://img.shields.io/npm/v/kondukt.svg)](https://www.npmjs.com/package/kondukt)
[![license](https://img.shields.io/npm/l/kondukt.svg)](./LICENSE)
[![CI](https://github.com/kondukt-dev/core/actions/workflows/ci.yml/badge.svg)](https://github.com/kondukt-dev/core/actions/workflows/ci.yml)

Kondukt is the dev toolkit for the [Model Context Protocol](https://modelcontextprotocol.io) —
a CLI, an SDK, and (uniquely) an MCP server itself that lets AI assistants like Claude Code,
Codex, and Gemini test, validate, and scaffold other MCP servers through natural language.

## Quick start

```bash
# Connect to any MCP server and see what it exposes
npx kondukt test "npx -y @modelcontextprotocol/server-everything"

# Validate it against the MCP specification
npx kondukt validate "npx -y @modelcontextprotocol/server-everything"

# Generate a new MCP server project
npx kondukt scaffold my-server --template typescript \
  --tool "get_weather:Get weather for city:city:string"

# Generate a context file for your AI coding tool
npx kondukt agent-docs . --target codex     # writes AGENTS.md
npx kondukt agent-docs . --all              # writes CLAUDE.md + AGENTS.md + GEMINI.md
```

## Use as an MCP server (Claude Code, Codex, Gemini)

Kondukt is itself an MCP server. Register it once and your AI assistant can drive MCP servers
through natural language.

### Claude Code

```bash
claude mcp add kondukt -- npx kondukt serve
```

Then ask Claude: *"Test my MCP server at `npx my-server` and validate it."*

### Codex

Add to your Codex MCP config (`~/.codex/config.toml` or equivalent):

```toml
[mcp_servers.kondukt]
command = "npx"
args = ["kondukt", "serve"]
```

### Gemini CLI

Add to `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "kondukt": { "command": "npx", "args": ["kondukt", "serve"] }
  }
}
```

## CLI reference

```
kondukt test <cmd>                              Show server capabilities
  kondukt test --url <url>                        (HTTP transport)
  kondukt test --bearer <token> ...               (auth)

kondukt inspect <cmd> [--tools|--resources|--prompts|--tool <name>]
                                                Show tables / schemas

kondukt call --tool <name> --args <json> <cmd>  Call a tool and print the result

kondukt validate <cmd>                          Run 19 protocol rules, print a 0–100 score

kondukt scaffold <name> --template ts|py [--tool <spec>...]
                                                Generate a new MCP server project

kondukt agent-docs [path] [--target claude|codex|gemini] [--all]
                                                Generate CLAUDE.md / AGENTS.md / GEMINI.md

kondukt serve [--http --port N]                 Run Kondukt itself as an MCP server
```

All commands accept `--format json` for machine-readable output.

## SDK usage

```ts
import { McpConnection } from "kondukt";

const conn = new McpConnection({
  type: "stdio",
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-everything"],
});

const info = await conn.connect();
console.log(info.name, info.toolCount);

const tools = await conn.listTools();
const result = await conn.callTool("echo", { text: "hello" });

await conn.disconnect();
```

Deeper imports: `kondukt/client`, `kondukt/server`, `kondukt/validator`, `kondukt/scaffold`, `kondukt/agent-docs`.

## Scaffold

```bash
npx kondukt scaffold my-weather --template typescript \
  --tool "get_weather:Get weather for city:city:string" \
  --tool "get_forecast:N-day forecast:city:string,days:number"
```

Produces a fully runnable project:

```
my-weather/
├── src/index.ts          # MCP server with both tools stubbed
├── package.json          # with @modelcontextprotocol/sdk
├── tsconfig.json
├── README.md
├── .gitignore
└── .github/workflows/ci.yml
```

Templates: `typescript` (Node 20+) and `python` (FastMCP).

## Agent-docs generator

Static analysis of an existing project → a context file that AI coding tools read:

```bash
kondukt agent-docs .                    # CLAUDE.md
kondukt agent-docs . --target codex     # AGENTS.md
kondukt agent-docs . --target gemini    # GEMINI.md
kondukt agent-docs . --all              # all three
```

Analyzers inspect `package.json` / `pyproject.toml`, directory structure, scripts, and framework/ORM/state/test patterns. Sections are emitted only when there's evidence — no hallucinated content.

## Validation rules

**Tools (7):** `tool-has-description`, `tool-description-quality`, `tool-schema-valid`, `tool-schema-has-types`, `tool-required-fields-exist`, `tool-name-convention`, `tool-no-duplicate-names`.

**Resources (4):** `resource-has-uri`, `resource-valid-uri`, `resource-has-name`, `resource-has-mime`.

**Prompts (3):** `prompt-has-description`, `prompt-args-described`, `prompt-required-args-marked`.

**Protocol (5):** `server-responds-initialize`, `server-reports-capabilities`, `server-responds-ping`, `tools-list-stable`, `server-version-valid`.

Scoring: 100 − 10·errors − 3·warnings, clamped to [0, 100].

## API reference

Every public entry point ships TypeScript declarations. Start with `kondukt` for the default export
(client SDK), or deep-import into `kondukt/validator`, `kondukt/scaffold`, `kondukt/agent-docs` for
specific subsystems. Generated `.d.ts` files live in `dist/**/*.d.ts`.

## Web app

A visual UI around these same capabilities is coming at [app.kondukt.dev](https://app.kondukt.dev).

## Contributing

Bug reports and pull requests welcome at [github.com/kondukt-dev/core](https://github.com/kondukt-dev/core/issues).

1. Fork, clone, `pnpm install`.
2. Make your change on a `feature/*` branch from `dev`.
3. `pnpm typecheck && pnpm lint && pnpm test:coverage` must be green.
4. Open a PR into `dev`. CI runs on Node 20 and 22.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/).

## License

MIT — see [LICENSE](./LICENSE).
