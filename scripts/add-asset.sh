#!/usr/bin/env bash
set -euo pipefail

node "$(dirname "$0")/add-asset.mjs" "$@"
