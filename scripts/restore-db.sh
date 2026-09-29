#!/usr/bin/env bash
set -euo pipefail

# Restaure une sauvegarde Postgres dans le conteneur de production.
# ATTENTION : écrase TOUTES les données actuelles de la base cible.
#
# Usage : ./scripts/restore-db.sh backups/copilote-20260915-030000.sql.gz

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-copilote_ia_business}"

if [ $# -ne 1 ]; then
  echo "Usage : $0 <fichier-de-sauvegarde.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Fichier introuvable : $BACKUP_FILE"
  exit 1
fi

echo "Ceci va ÉCRASER toutes les données actuelles de la base '$POSTGRES_DB'."
read -r -p "Tapez 'oui' pour confirmer : " confirm
if [ "$confirm" != "oui" ]; then
  echo "Annulé."
  exit 1
fi

echo "Restauration de $BACKUP_FILE en cours..."
gunzip -c "$BACKUP_FILE" | docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$POSTGRES_USER" "$POSTGRES_DB"

echo "Restauration terminée."
