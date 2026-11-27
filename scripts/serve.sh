#!/bin/sh
# Sobe (ou reinicia) o build de produção em background na porta indicada.
# Uso: PORT=3140 sh scripts/serve.sh   (o build precisa existir: npm run build)
# O servidor roda em um grupo de processos próprio (setsid); o PGID fica em .forja/server.pid.
set -eu
PORT="${PORT:-3140}"
cd "$(dirname "$0")/.."
mkdir -p .forja
if [ -f .forja/server.pid ]; then
  kill -- "-$(cat .forja/server.pid)" 2>/dev/null || true
  rm -f .forja/server.pid
fi
pkill -f "next start -p $PORT" 2>/dev/null || true
sleep 1
NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-http://127.0.0.1:$PORT}" setsid nohup npm run start -- -p "$PORT" -H 0.0.0.0 > .forja/server.log 2>&1 &
echo "$!" > .forja/server.pid
for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf -o /dev/null "http://127.0.0.1:$PORT/"; then
    echo "Servidor no ar: http://127.0.0.1:$PORT (grupo de processos $(cat .forja/server.pid))"
    exit 0
  fi
  sleep 1
done
echo "Servidor não respondeu em http://127.0.0.1:$PORT; veja .forja/server.log" >&2
exit 1
