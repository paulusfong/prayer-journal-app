#!/usr/bin/env bash
# Local production deploy: schema push (Turso) then Vercel --prod.
# Requires: logged-in Vercel CLI (or VERCEL_TOKEN), DATABASE_URL + DATABASE_AUTH_TOKEN.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

url="${DATABASE_URL:-}"
if [[ -z "$url" ]]; then
  echo "DATABASE_URL is required (Turso/libSQL). Do not use file:./data/journal.sqlite."
  exit 1
fi
if [[ "$url" == file:* ]]; then
  echo "Refusing local file DATABASE_URL in production."
  exit 1
fi

npm run db:push
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  exec npx vercel --prod --yes --token="$VERCEL_TOKEN"
fi
exec npx vercel --prod --yes
