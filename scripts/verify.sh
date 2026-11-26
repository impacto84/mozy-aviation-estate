#!/bin/sh
# Verificação completa do projeto: typecheck → lint → testes → build de produção.
# Limite de heap por processo para caber no cgroup de 4 GiB (o passe anterior morreu por OOM).
set -eu
cd "$(dirname "$0")/.."
export NODE_OPTIONS="--max-old-space-size=1536"
export NEXT_TELEMETRY_DISABLED=1
export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-http://127.0.0.1:3140}"

echo "==> typecheck"
npm run typecheck
echo "==> lint"
npm run lint
echo "==> test"
npm run test
echo "==> build (NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL)"
npm run build
echo "==> verify: tudo verde"
