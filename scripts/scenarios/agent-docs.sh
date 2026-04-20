#!/usr/bin/env bash
# Generate a CLAUDE.md context file for a small fixture project and print
# the first chunk so the viewer sees real detected content.

. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$TMP"

cat > package.json <<'JSON'
{
  "name": "acme-api",
  "type": "module",
  "scripts": { "dev": "tsx src/server.ts", "test": "vitest", "build": "tsup" },
  "dependencies": { "fastify": "^4", "drizzle-orm": "^0.30" },
  "devDependencies": { "vitest": "^2", "tsup": "^8", "typescript": "^5" }
}
JSON
mkdir -p src tests

clear_screen
sleep 1

type_and_run 'kondukt agent-docs . --target claude --stdout | head -n 25'
sleep 3
