#!/bin/sh
# Regenerate src/database.types.ts from website-staging, the Supabase project
# a migration reaches first (docs/agents/release.md#supabase): the types can
# follow a migration before the owner applies it to production.
#
#   SUPABASE_ACCESS_TOKEN=… npm run db:types              # from website-staging
#   SUPABASE_ACCESS_TOKEN=… npm run db:types -- <ref>     # from another project
#
# The token is a Supabase personal access token, read from the environment
# only (never from a file in the repository). Project refs are not secrets:
# each one is embedded in its public anon key.
set -eu
cd "$(dirname "$0")/.."

STAGING_REF=cevuqyhwtzjujxsocxkb
PRODUCTION_REF=fsklunxplbbtzgurwqmc
PROJECT_REF=${1:-$STAGING_REF}
OUT=src/database.types.ts

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "error: SUPABASE_ACCESS_TOKEN is not set (a Supabase personal access token)" >&2
  exit 1
fi

# Via a temp file: redirecting straight into database.types.ts truncated it
# before the command ran, so a failed generation (expired token) destroyed the
# committed types.
TMP=$(mktemp)
trap 'rm -f "$TMP" "$TMP.kept"' EXIT
npx supabase gen types typescript --project-id "$PROJECT_REF" > "$TMP"

# __InternalSupabase.PostgrestVersion is the PostgREST version of the project
# generated from, not part of the schema: supabase-js reads it to allow, at
# the type level, what PostgREST 13 and later support (maxAffected(), spreading
# a to-many relation). The sites and the app run against production, so the
# committed line keeps production's value when generating from another
# project; a generation from production updates it.
if [ "$PROJECT_REF" != "$PRODUCTION_REF" ] && [ -f "$OUT" ]; then
  KEPT=$(grep -m1 -E '^[[:space:]]*PostgrestVersion: "' "$OUT" || true)
  if [ -n "$KEPT" ]; then
    awk -v kept="$KEPT" \
      '!done && /^[[:space:]]*PostgrestVersion: "/ { print kept; done = 1; next } { print }' \
      "$TMP" > "$TMP.kept"
    mv "$TMP.kept" "$TMP"
  fi
fi

mv "$TMP" "$OUT"
npx prettier --write "$OUT"
