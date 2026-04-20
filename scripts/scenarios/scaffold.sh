#!/usr/bin/env bash
# Scaffold a weather-server project from a --tool spec and show the tree.

. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$TMP"

clear_screen
sleep 1

type_and_run 'kondukt scaffold weather-server --template typescript --tool "get_weather:Get weather for city:city:string"'
sleep 1

type_and_run 'ls weather-server/'
sleep 3
