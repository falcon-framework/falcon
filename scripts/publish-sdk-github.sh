#!/usr/bin/env bash
# Publish @falcon-framework/sdk to GitHub Packages. Run before npm (changeset publish).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

TOKEN="${GITHUB_TOKEN:-${GITHUB_PACKAGES_TOKEN:-}}"
if [ -z "$TOKEN" ]; then
  echo "publish-sdk-github.sh: set GITHUB_TOKEN or GITHUB_PACKAGES_TOKEN" >&2
  exit 1
fi

TMP_NPMRC="$(mktemp)"
trap 'rm -f "$TMP_NPMRC"' EXIT
{
  echo "@falcon-framework:registry=https://npm.pkg.github.com"
  echo "//npm.pkg.github.com/:_authToken=${TOKEN}"
} > "$TMP_NPMRC"
export NPM_CONFIG_USERCONFIG="$TMP_NPMRC"
(cd "$ROOT/packages/sdk" && npm publish --registry=https://npm.pkg.github.com --no-provenance)
unset NPM_CONFIG_USERCONFIG
