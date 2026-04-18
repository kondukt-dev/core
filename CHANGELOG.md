# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/kondukt-dev/core/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/kondukt-dev/core/releases/tag/v0.1.0
