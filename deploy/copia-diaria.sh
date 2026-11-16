#!/usr/bin/env bash
# Cópia diária da pasta de dados (banco + fotos) para /var/backups/equiparloc.
# Guarda os últimos 14 dias. Agendar no cron do root (ver LOCAWEB-VPS.md):
#   15 3 * * * /opt/equiparloc/app/deploy/copia-diaria.sh
set -euo pipefail

DATA=/var/lib/equiparloc
DEST=/var/backups/equiparloc
mkdir -p "$DEST"
chmod 700 "$DEST"

tar -czf "$DEST/equiparloc-$(date +%F).tar.gz" -C "$DATA" .
chmod 600 "$DEST"/*.tar.gz
find "$DEST" -name 'equiparloc-*.tar.gz' -mtime +14 -delete
