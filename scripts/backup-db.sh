#!/usr/bin/env bash
set -euo pipefail

# Sauvegarde la base Postgres de production dans un fichier compressé local,
# avec rotation automatique (supprime les sauvegardes plus vieilles que
# RETENTION_DAYS). Conçu pour être lancé via cron sur le serveur de
# production — voir la ligne crontab suggérée à la fin de ce fichier.
#
# Usage : ./scripts/backup-db.sh
# Variables surchargeables : BACKUP_DIR, RETENTION_DAYS, COMPOSE_FILE,
# POSTGRES_USER, POSTGRES_DB (par défaut, lit POSTGRES_USER/POSTGRES_DB
# depuis le .env du répertoire courant si présent).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-copilote_ia_business}"

mkdir -p "$BACKUP_DIR"

timestamp=$(date +%Y%m%d-%H%M%S)
filename="$BACKUP_DIR/copilote-${timestamp}.sql.gz"

echo "Sauvegarde de la base '$POSTGRES_DB' en cours..."
docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$filename"

size=$(du -h "$filename" | cut -f1)
echo "Sauvegarde créée : $filename ($size)"

# Rotation : supprime les sauvegardes plus anciennes que RETENTION_DAYS.
find "$BACKUP_DIR" -name 'copilote-*.sql.gz' -mtime "+${RETENTION_DAYS}" -delete

echo "Sauvegardes actuellement conservées dans $BACKUP_DIR :"
ls -lh "$BACKUP_DIR"/copilote-*.sql.gz 2>/dev/null || echo "(aucune)"

# --- Mise en place du cron (à faire une fois sur le serveur de production) ---
# 1. Rendre le script exécutable :   chmod +x scripts/backup-db.sh
# 2. Éditer la crontab :             crontab -e
# 3. Ajouter (sauvegarde chaque nuit à 3h, depuis la racine du projet) :
#      0 3 * * * cd /chemin/vers/le/projet && ./scripts/backup-db.sh >> /var/log/copilote-backup.log 2>&1
