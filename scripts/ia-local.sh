#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a

MODELO=${AI_MODEL:-qwen2.5:1.5b}

docker compose --profile ia-local up -d ollama
echo "Descargando el modelo $MODELO (la primera vez tarda unos minutos)..."
docker compose exec ollama ollama pull "$MODELO"
docker compose restart backend
echo "Listo, el chat ya usa $MODELO"
