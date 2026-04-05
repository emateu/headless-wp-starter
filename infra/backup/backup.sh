#!/bin/sh
set -eu

BACKUP_DIR="/backups"
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
FILENAME="db_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"; }

log "Starting backup..."

# 1. Dump and compress
mysqldump \
  --host="$DB_HOST" \
  --user="$DB_USER" \
  --password="$DB_PASSWORD" \
  --single-transaction \
  --routines \
  --triggers \
  "$DB_NAME" | gzip > "$FILEPATH"

log "Dump complete: $FILENAME ($(du -h "$FILEPATH" | cut -f1))"

# 2. Upload to R2
if [ -n "${R2_BUCKET:-}" ]; then
  rclone copy "$FILEPATH" "r2:${R2_BUCKET}/db/"
  log "DB dump uploaded to R2"

  # Sync WordPress uploads to R2
  if [ -d "/uploads" ]; then
    rclone sync /uploads "r2:${R2_BUCKET}/uploads/" --transfers 8
    log "Uploads synced to R2"
  fi
else
  log "R2 not configured, skipping upload"
fi

# 3. Prune old backups
#    < 48h:   keep all (~8 copies at 6h interval)
#    48h-7d:  keep one per day
#    7d-28d:  keep one per week
#    > 28d:   delete
delete_backup() {
  rm -f "$1"
  if [ -n "${R2_BUCKET:-}" ]; then
    rclone deletefile "r2:${R2_BUCKET}/$2" 2>/dev/null || true
  fi
  log "Pruned: $2"
}

now=$(date +%s)
kept_days=""
kept_weeks=""

for f in $(ls -t "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null); do
  [ -f "$f" ] || continue

  file_epoch=$(stat -c %Y "$f")
  age_hours=$(( (now - file_epoch) / 3600 ))
  base=$(basename "$f")

  # < 48h: keep all
  [ "$age_hours" -le 48 ] && continue

  # > 28d: delete
  if [ "$age_hours" -gt 672 ]; then
    delete_backup "$f" "$base"
    continue
  fi

  # 48h-7d: one per day
  if [ "$age_hours" -le 168 ]; then
    day=$(date -d "@${file_epoch}" +%Y%m%d)
    case " $kept_days " in
      *" $day "*) delete_backup "$f" "$base" ;;
      *) kept_days="$kept_days $day" ;;
    esac
    continue
  fi

  # 7d-28d: one per week
  week=$(date -d "@${file_epoch}" +%G%V)
  case " $kept_weeks " in
    *" $week "*) delete_backup "$f" "$base" ;;
    *) kept_weeks="$kept_weeks $week" ;;
  esac
done

log "Backup complete"
