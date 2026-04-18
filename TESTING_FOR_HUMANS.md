# Testing Kondukt — 5 pragmatic scenarios

This guide walks you (the owner/operator) through hands-on verification of every Kondukt
capability, without requiring deep MCP knowledge.

All scenarios assume you're in `/path/to/kondukt/core` with `pnpm install` done.
Run commands via `pnpm tsx src/cli/index.ts <command>` (before npm publish) or
`npx kondukt <command>` (after publish).

---

## Scenario 1 — Connect to a real MCP server

**Goal:** Prove the client SDK + CLI can talk to a production MCP server.

```bash
pnpm tsx src/cli/index.ts test npx -y @modelcontextprotocol/server-everything
```

**Expected output** (excerpt):

```
mcp-servers/everything v2.0.0
Tools:     13
Resources: 7
Prompts:   4
```

**What it proves:** stdio transport works, `initialize` handshake completes, capability counts are read back.

---

## Scenario 2 — Validate a server

**Goal:** Prove the Schema Validator emits sensible reports.

Start with the official Anthropic fixture server (should score high):

```bash
pnpm tsx src/cli/index.ts validate npx -y @modelcontextprotocol/server-everything
```

**Expected:** `Score: 100/100` with ~13 info-level notes (kebab-case tool names). No errors, no warnings.

Now validate Kondukt's own mock fixture (clean-room sanity check):

```bash
pnpm tsx src/cli/index.ts validate npx -y tsx tests/fixtures/mock-server.ts
```

**Expected:** score ≥ 85.

**What it proves:** validator orchestrator runs end-to-end, scoring is deterministic, issues carry severity + suggestion.

---

## Scenario 3 — Scaffold + run a project (TypeScript)

**Goal:** Generate a new MCP server, build it, test it through Kondukt.

```bash
# 1. Generate
pnpm tsx src/cli/index.ts scaffold weather-demo --template typescript \
  --output-dir /tmp \
  --tool "get_weather:Get weather for a city:city:string" \
  --tool "get_forecast:N-day forecast:city:string,days:number"

# 2. Install + build
cd /tmp/weather-demo
pnpm install
pnpm build

# 3. Test it back through Kondukt
cd -
pnpm tsx src/cli/index.ts test node /tmp/weather-demo/dist/index.js
pnpm tsx src/cli/index.ts validate node /tmp/weather-demo/dist/index.js
```

**Expected:** `Tools: 2`, both names listed. Validate score ≥ 85.

**Cleanup:** `rm -rf /tmp/weather-demo`.

**What it proves:** template bundling works in dev (tsx) and the generated project is runnable & spec-compliant out of the box.

---

## Scenario 4 — Agent-docs for three targets

**Goal:** Prove the agent-docs generator produces CLAUDE.md, AGENTS.md, GEMINI.md from the same analysis.

```bash
# Pick any real project; using the scaffold output from Scenario 3 as example
TARGET=/tmp/weather-demo

pnpm tsx src/cli/index.ts agent-docs $TARGET --all
ls $TARGET/*.md
```

**Expected:** three files — `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` — each with a target-specific first-line note ("Context file for Claude Code / Codex / Gemini CLI") but otherwise identical analysis.

Inspect one:

```bash
head -20 $TARGET/AGENTS.md
```

**Expected:** `# weather-demo`, `Context file for Codex`, sections Project overview / Commands / Architecture / Conventions.

**What it proves:** one generator, multiple output targets, no hallucinated content.

---

## Scenario 5 — Kondukt as an MCP server in Claude Code

**Goal:** Prove Kondukt itself is usable via any MCP client.

```bash
# Register (before npm publish, via pnpm tsx):
claude mcp add kondukt -- pnpm --dir /path/to/kondukt/core tsx src/cli/index.ts serve

# After npm publish:
# claude mcp add kondukt -- npx kondukt serve
```

Open a fresh Claude Code session and type:

> Use the kondukt MCP server to test the server at `npx -y @modelcontextprotocol/server-everything` and validate it.

**Expected:** Claude invokes `test_server` and `validate_server`, returns capability counts and a score. No manual JSON editing required.

**What it proves:** the full cycle — Claude Code → Kondukt MCP server → target MCP server → capability/validation report — works end-to-end.

---

## Troubleshooting

- **"command not found: kondukt"** — before npm publish, use `pnpm tsx src/cli/index.ts <command>` from the repo root.
- **"CI status is failing" on a PR** — look at `pnpm test:coverage` output first; coverage thresholds enforced (≥80% lines, ≥70% branches).
- **Generated projects can't install** — `pnpm install --ignore-scripts` isolates from parent workspace quirks.
- **Scaffold templates not copied into dist/** — make sure `pnpm build` finished; the post-tsup step (`scripts/copy-templates.mjs`) runs last.

---

## Next steps after all 5 scenarios pass

1. Add `NPM_TOKEN` as a GitHub secret (Settings → Secrets and variables → Actions → New repository secret).
2. Merge the `dev → main` PR (opened by Claude). First push to `main` triggers `.github/workflows/publish.yml`, which publishes to npm.
