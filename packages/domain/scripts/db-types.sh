#!/bin/sh
# Regenerate src/database.types.ts from the remote Supabase project.
# Token source: SUPABASE_ACCESS_TOKEN env var, else apps/website/.env.local (gitignored).
# The project ref is not a secret: it is embedded in the public anon JWT.
set -eu
cd "$(dirname "$0")/.."

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  TOKEN=$(grep -h '^SUPABASE_ACCESS_TOKEN=' ../../apps/website/.env.local 2>/dev/null | cut -d= -f2 || true)
  if [ -z "${TOKEN:-}" ]; then
    echo "error: SUPABASE_ACCESS_TOKEN not set and not found in apps/website/.env.local" >&2
    exit 1
  fi
  SUPABASE_ACCESS_TOKEN=$TOKEN
  export SUPABASE_ACCESS_TOKEN
fi

# Via a temp file: redirecting straight into database.types.ts truncated it
# before the command ran, so a failed generation (expired token) destroyed the
# committed types.
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
npx supabase gen types typescript --project-id fsklunxplbbtzgurwqmc > "$TMP"
mv "$TMP" src/database.types.ts
npx prettier --write src/database.types.ts
