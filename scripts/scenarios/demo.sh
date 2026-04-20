#!/usr/bin/env bash
# Demo: kondukt test + validate against the MCP everything-server.
# Lands on the 100/100 score — the headline moment.

. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

clear_screen
sleep 1

type_and_run 'kondukt test "npx -y @modelcontextprotocol/server-everything"'
sleep 2

type_and_run 'kondukt validate "npx -y @modelcontextprotocol/server-everything"'
sleep 3
