#!/usr/bin/env bash
# Validate a real-world MCP server and show the score with actionable warnings.
# Uses @wonderwhy-er/desktop-commander — a popular third-party server that
# surfaces meaningful (non-100) findings, unlike Anthropic's clean reference
# servers.

. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

clear_screen
sleep 1

type_and_run 'kondukt validate "npx -y @wonderwhy-er/desktop-commander"'
sleep 3
