# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.2] — 2026-04-22

### Changed

- **Validator** — dropped the `tool-name-convention` rule (snake_case enforcement). MCP spec does not prescribe a naming style and the rule produced false-positive info noise against kebab-case servers (including Anthropic's own reference servers). The rule set is now 18 rules (6 tool / 4 resource / 3 prompt / 5 protocol).

### Fixed

- **CLI** — `kondukt --version` now reports the real package version instead of the hardcoded `0.1.0-dev.0` placeholder.

### Added

- **Demo** — fifth demo GIF (`assets/validate.gif`) covering `kondukt validate`. Demos now cover test, validate, call, scaffold, and agent-docs.

## [0.1.1] — 2026-04-20

### Fixed

- **Scaffold** — `kondukt scaffold` no longer fails with `Template 'typescript' not found` when invoked through the bundled CLI. 0.1.0 on npm shipped a broken scaffold command because tsup inlines scaffold into `dist/cli/index.js`, and the template lookup only checked `SELF_DIR/templates`. The generator now also checks `SELF_DIR/../scaffold/templates`, so it works from the bundled CLI, the standalone scaffold entry, and directly from source.
- **CLI** — `kondukt test "npx -y @foo/bar"` (the quoted-string form documented throughout the README) now works. Commander was treating the whole quoted string as one positional token; `buildConfigFromCli` now shell-splits a single whitespace-containing arg.

### Added

- **Demo recording pipeline** — `scripts/record-demo.sh` plus per-feature scenarios under `scripts/scenarios/` regenerate four GIFs (`demo`, `scaffold`, `call`, `agent-docs`) from scratch in one command. `.cast` and `.mp4` byproducts live in a gitignored `assets/local/`.
- **README** — marketing-style refresh (Postman-for-MCP framing), demo GIF at the top, per-feature GIFs under each subsection, Why + Comparison consolidated into a single pitch block.

## [0.1.0] — 2026-04-18

Initial release.

### Added

- **Client SDK** — `McpConnection`, `ConnectionManager`, stdio + Streamable HTTP transports with Bearer / API-key / custom-header auth, timeout enforcement, event emission.
- **Kondukt MCP server** — Kondukt itself exposed as an MCP server, usable via `claude mcp add kondukt -- npx kondukt serve` (or from any other MCP client). Nine tools: `test_server`, `list_tools`, `call_tool`, `list_resources`, `read_resource`, `list_prompts`, `get_prompt`, `validate_server`, `scaffold_server`.
- **Schema Validator** — 19 rules (7 tool / 4 resource / 3 prompt / 5 protocol) per the MCP specification, with deterministic 0–100 scoring (−10 per error, −3 per warning).
- **Scaffold Generator** — generates MCP server projects from Handlebars templates. Two templates: TypeScript and Python (FastMCP).
- **Agent-docs Generator** — analyzes an existing project and emits a context file for an AI coding tool. Targets: `claude` → `CLAUDE.md`, `codex` → `AGENTS.md`, `gemini` → `GEMINI.md`.
- **CLI** — `kondukt test`, `inspect`, `call`, `validate`, `scaffold`, `agent-docs`, `serve`. Deprecated alias `kondukt claudemd`.
- **Public API entry points** — `kondukt`, `kondukt/client`, `kondukt/server`, `kondukt/validator`, `kondukt/scaffold`, `kondukt/agent-docs`, `kondukt/claudemd` (deprecated).

[Unreleased]: https://github.com/kondukt-dev/core/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/kondukt-dev/core/releases/tag/v0.1.2
[0.1.1]: https://github.com/kondukt-dev/core/releases/tag/v0.1.1
[0.1.0]: https://github.com/kondukt-dev/core/releases/tag/v0.1.0
