#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a

DB_NAME=${DB_NAME:-zaguan}
DB_USER=${DB_USER:-zaguan}
DIR=backups
MANTENER=${MANTENER:-7}

mkdir -p "$DIR"
ARCHIVO="$DIR/zaguan_$(date +%Y-%m-%d_%H-%M).sql.gz"

docker compose exec -T db pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$ARCHIVO"
echo "[$(date '+%F %T')] Backup creado: $ARCHIVO ($(du -h "$ARCHIVO" | cut -f1))"

ls -1t "$DIR"/zaguan_*.sql.gz | tail -n +$((MANTENER + 1)) | xargs -r rm --
