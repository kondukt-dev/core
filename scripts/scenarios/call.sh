#!/usr/bin/env bash
# Call an individual tool on an MCP server with custom JSON args.

. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

clear_screen
sleep 1

type_and_run 'kondukt call --tool echo --args '"'"'{"message":"hello from kondukt"}'"'"' "npx -y @modelcontextprotocol/server-everything"'
sleep 3
