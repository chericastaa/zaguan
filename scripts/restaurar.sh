#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a

DB_NAME=${DB_NAME:-zaguan}
DB_USER=${DB_USER:-zaguan}
ARCHIVO=${1:-$(ls -1t backups/zaguan_*.sql.gz 2>/dev/null | head -n 1)}

if [ -z "$ARCHIVO" ] || [ ! -f "$ARCHIVO" ]; then
  echo "No encontré ningún backup. Uso: ./scripts/restaurar.sh backups/archivo.sql.gz"
  exit 1
fi

read -rp "Esto reemplaza la base actual con $ARCHIVO. ¿Seguir? (s/n) " ok
[ "$ok" = "s" ] || exit 0

docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
gunzip -c "$ARCHIVO" | docker compose exec -T db psql -q -U "$DB_USER" -d "$DB_NAME"
echo "Base restaurada desde $ARCHIVO"
