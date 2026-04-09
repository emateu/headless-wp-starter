#!/usr/bin/env bash
# Restore the local WordPress stack from a Cloudflare R2 backup:
#   1. Starts the local docker-compose.yml stack
#   2. Downloads the latest DB dump from R2 and imports it into MariaDB
#   3. Downloads all uploads from R2 into the wp_uploads volume
#   4. Rewrites remote URLs in the DB to http://localhost:${WP_PORT}
#
# Requires: docker + docker compose v2. R2 credentials loaded from .env.
#
# Usage:
#   ./infra/backup/restore-from-r2.sh [--bucket NAME] [--dump FILE]
#                                     [--skip-db] [--skip-uploads]
#                                     [--no-search-replace]
#
# Examples:
#   ./infra/backup/restore-from-r2.sh
#   ./infra/backup/restore-from-r2.sh --bucket my-backup-prod
#   ./infra/backup/restore-from-r2.sh --dump db_20260101T000000Z.sql.gz
#   ./infra/backup/restore-from-r2.sh --skip-uploads

set -euo pipefail

# ------------------------------------------------------------------------------
# Paths
# ------------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
ENV_FILE="$ROOT_DIR/.env"

# ------------------------------------------------------------------------------
# Logging
# ------------------------------------------------------------------------------
log()  { printf '\033[1;34m[restore]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[restore]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[restore]\033[0m %s\n' "$*" >&2; exit 1; }

# ------------------------------------------------------------------------------
# CLI flags
# ------------------------------------------------------------------------------
SKIP_DB=0
SKIP_UPLOADS=0
SKIP_SEARCH_REPLACE=0
DUMP_NAME=""
BUCKET_OVERRIDE=""

usage() {
  cat <<'EOF'
Restore local WordPress from a Cloudflare R2 backup.

What it does (in order):
  1. Starts db + wordpress containers (docker-compose.yml)
  2. Downloads the latest DB dump from R2 and imports it into MariaDB
  3. Syncs all uploads from R2 into the wp_uploads volume
  4. Rewrites remote URLs to http://localhost:${WP_PORT} via wp search-replace

Usage:
  restore-from-r2.sh [options]
  pnpm wp:restore [-- options]

Options:
  --bucket <name>       Override R2_BUCKET from .env (e.g. my-backup-prod)
  --dump <filename>     Restore a specific dump (default: latest db_*.sql.gz)
  --skip-db             Don't download / import the DB dump
  --skip-uploads        Don't download uploads
  --no-search-replace   Don't rewrite remote URLs to localhost
  -h, --help            Show this help

Setup (.env):
  Copy .env.example to .env and fill in the R2 credentials. You can find them
  in the Cloudflare dashboard: R2 → your bucket → Manage R2 API Tokens.
  Or grab them from a deployed VPS: ssh deploy@<ip> cat /opt/app/.env

  Required variables:

    R2_ACCESS_KEY=<Access Key ID from Cloudflare R2>
    R2_SECRET_KEY=<Secret Access Key from Cloudflare R2>
    R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
    R2_BUCKET=<bucket-name>

  The rest of the .env (DB_*, WP_PORT, etc.) can keep the defaults from
  .env.example — they're only used for the local stack.

Examples:
  pnpm wp:restore                              # latest dump + all uploads
  pnpm wp:restore -- --bucket my-backup-prod   # use a different bucket
  pnpm wp:restore -- --skip-uploads            # DB only (faster)
  pnpm wp:restore -- --skip-db                 # refresh uploads without reimporting
  pnpm wp:restore -- --dump db_20260401T060000Z.sql.gz  # specific dump

After restore:
  - WordPress admin uses the credentials from the restored dump (not admin/admin).
    To reset: docker compose exec wordpress wp user update admin --user_pass=admin --allow-root
  - Run 'pnpm dev' in another terminal to start Next.js on http://localhost:3000.

Requires: docker, docker compose v2. No local rclone or mysql client needed
(everything runs inside containers).
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --bucket)            BUCKET_OVERRIDE="${2:?--bucket needs a value}"; shift 2 ;;
    --dump)              DUMP_NAME="${2:?--dump needs a value}"; shift 2 ;;
    --skip-db)           SKIP_DB=1; shift ;;
    --skip-uploads)      SKIP_UPLOADS=1; shift ;;
    --no-search-replace) SKIP_SEARCH_REPLACE=1; shift ;;
    -h|--help)           usage; exit 0 ;;
    *)                   die "Unknown flag: $1 (use --help)" ;;
  esac
done

# ------------------------------------------------------------------------------
# Prerequisites
# ------------------------------------------------------------------------------
command -v docker >/dev/null 2>&1 || die "docker not found in PATH"
docker compose version >/dev/null 2>&1 || die "docker compose v2 is required"
[ -f "$COMPOSE_FILE" ] || die "compose file not found: $COMPOSE_FILE"

# ------------------------------------------------------------------------------
# Load .env
# ------------------------------------------------------------------------------
if [ -f "$ENV_FILE" ]; then
  log "Loading $ENV_FILE"
  # Parse .env line-by-line instead of sourcing it as a shell script. Docker
  # Compose allows unquoted values with spaces (e.g. `WP_TITLE=My Site`), but
  # `. .env` would try to execute `Site` as a command. This parser handles
  # those values safely while still supporting quotes, comments, and `export`.
  while IFS='=' read -r _env_key _env_value || [ -n "$_env_key" ]; do
    case "$_env_key" in ''|\#*) continue ;; esac
    _env_key="${_env_key#export }"
    _env_key="${_env_key# }"
    _env_key="${_env_key% }"
    case "$_env_key" in *[!a-zA-Z0-9_]*) continue ;; esac
    _env_value="${_env_value%\"}"; _env_value="${_env_value#\"}"
    _env_value="${_env_value%\'}"; _env_value="${_env_value#\'}"
    export "$_env_key=$_env_value"
  done < "$ENV_FILE"
  unset _env_key _env_value
else
  warn "$ENV_FILE not found — relying on shell environment"
fi

[ -n "$BUCKET_OVERRIDE" ] && R2_BUCKET="$BUCKET_OVERRIDE"

: "${R2_ACCESS_KEY:?R2_ACCESS_KEY is required (set it in $ENV_FILE)}"
: "${R2_SECRET_KEY:?R2_SECRET_KEY is required (set it in $ENV_FILE)}"
: "${R2_ENDPOINT:?R2_ENDPOINT is required (set it in $ENV_FILE)}"
: "${R2_BUCKET:?R2_BUCKET is required (set it in $ENV_FILE or pass --bucket)}"

DB_NAME="${DB_NAME:-wordpress}"
DB_USER="${DB_USER:-wordpress}"
DB_PASSWORD="${DB_PASSWORD:-wordpress}"
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-rootpassword}"
WP_PORT="${WP_PORT:-8080}"
LOCAL_URL="http://localhost:${WP_PORT}"

# ------------------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------------------
compose() { docker compose -f "$COMPOSE_FILE" "$@"; }

R2_ENV_ARGS=(
  -e "RCLONE_CONFIG_R2_TYPE=s3"
  -e "RCLONE_CONFIG_R2_PROVIDER=Cloudflare"
  -e "RCLONE_CONFIG_R2_ACCESS_KEY_ID=$R2_ACCESS_KEY"
  -e "RCLONE_CONFIG_R2_SECRET_ACCESS_KEY=$R2_SECRET_KEY"
  -e "RCLONE_CONFIG_R2_ENDPOINT=$R2_ENDPOINT"
  -e "RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true"
)

# ------------------------------------------------------------------------------
# Preflight: verify R2 credentials and bucket access before touching Docker.
# Gives a clear, actionable error if anything is misconfigured.
# ------------------------------------------------------------------------------
log "Verifying R2 access to bucket '$R2_BUCKET'"
if ! r2_preflight=$(docker run --rm "${R2_ENV_ARGS[@]}" rclone/rclone:latest \
    lsf "r2:$R2_BUCKET/" --max-depth 1 2>&1); then
  printf '\033[1;31m[restore]\033[0m R2 preflight failed:\n' >&2
  printf '%s\n' "$r2_preflight" | sed 's/^/  /' >&2
  cat >&2 <<EOF

Cannot access r2:$R2_BUCKET/. Check these values in $ENV_FILE:

  R2_ACCESS_KEY  (starts with: ${R2_ACCESS_KEY:0:8}…)
  R2_SECRET_KEY  (hidden)
  R2_ENDPOINT    $R2_ENDPOINT
  R2_BUCKET      $R2_BUCKET

Common causes:
  • "directory not found"     → wrong R2_BUCKET name
  • "AccessDenied" (403)      → wrong credentials, or token scoped to another bucket
  • DNS / signature error     → wrong R2_ENDPOINT (check the account id in the URL)
  • "connection refused"      → network / firewall issue

To troubleshoot, run:
  docker run --rm \\
    -e RCLONE_CONFIG_R2_TYPE=s3 \\
    -e RCLONE_CONFIG_R2_PROVIDER=Cloudflare \\
    -e RCLONE_CONFIG_R2_ACCESS_KEY_ID=<key> \\
    -e RCLONE_CONFIG_R2_SECRET_ACCESS_KEY=<secret> \\
    -e RCLONE_CONFIG_R2_ENDPOINT=<endpoint> \\
    rclone/rclone lsd r2:<bucket>/
EOF
  exit 1
fi

if [ -z "$r2_preflight" ]; then
  die "R2 bucket '$R2_BUCKET' is reachable but empty — nothing to restore"
fi
log "R2 access OK. Top-level entries:"
printf '%s\n' "$r2_preflight" | sed 's/^/  /'

# ------------------------------------------------------------------------------
# 1. Ensure the database container is up
# ------------------------------------------------------------------------------
log "Starting database container"
compose up -d --build --wait db

# ------------------------------------------------------------------------------
# 2. Import DB: find latest dump, drop/recreate DB, stream-import from R2
# ------------------------------------------------------------------------------
if [ "$SKIP_DB" -eq 1 ]; then
  warn "Skipping DB import (--skip-db)"
else
  if [ -z "$DUMP_NAME" ]; then
    log "Finding latest dump in r2:$R2_BUCKET/db/"
    DUMP_NAME=$(
      docker run --rm "${R2_ENV_ARGS[@]}" rclone/rclone:latest \
        lsf "r2:$R2_BUCKET/db/" --include 'db_*.sql.gz' \
      | sort | tail -n1 | tr -d '\r'
    )
    [ -n "$DUMP_NAME" ] || die "No dumps matching db_*.sql.gz in r2:$R2_BUCKET/db/"
  fi
  log "Dump: $DUMP_NAME"

  log "Dropping and recreating database '$DB_NAME'"
  compose exec -T db mariadb -u root -p"$DB_ROOT_PASSWORD" -e \
    "DROP DATABASE IF EXISTS \`$DB_NAME\`; CREATE DATABASE \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

  log "Streaming dump from R2 into MariaDB (this may take a while)"
  docker run --rm "${R2_ENV_ARGS[@]}" rclone/rclone:latest \
    cat "r2:$R2_BUCKET/db/$DUMP_NAME" \
    | gunzip \
    | compose exec -T db mariadb -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"
  log "DB import complete"
fi

# ------------------------------------------------------------------------------
# 3. Start wordpress (now with a populated DB)
# ------------------------------------------------------------------------------
log "Starting wordpress container"
compose up -d --build --wait wordpress
WP_CONTAINER=$(compose ps -q wordpress)
[ -n "$WP_CONTAINER" ] || die "wordpress container id not found"

# ------------------------------------------------------------------------------
# 4. Sync uploads into the wp_uploads volume (via --volumes-from wordpress)
# ------------------------------------------------------------------------------
if [ "$SKIP_UPLOADS" -eq 1 ]; then
  warn "Skipping uploads (--skip-uploads)"
else
  log "Syncing uploads from r2:$R2_BUCKET/uploads/ → wp_uploads volume"
  docker run --rm --volumes-from "$WP_CONTAINER" "${R2_ENV_ARGS[@]}" \
    rclone/rclone:latest sync \
    "r2:$R2_BUCKET/uploads/" /var/www/html/wp-content/uploads/ \
    --transfers 8 --progress

  log "Fixing uploads ownership to www-data"
  compose exec -T wordpress chown -R www-data:www-data /var/www/html/wp-content/uploads
fi

# ------------------------------------------------------------------------------
# 5. Rewrite remote URLs to localhost (via wp search-replace)
# ------------------------------------------------------------------------------
if [ "$SKIP_SEARCH_REPLACE" -eq 1 ]; then
  warn "Skipping URL search-replace (--no-search-replace)"
else
  PROD_URL=$(
    compose exec -T wordpress wp option get siteurl \
      --allow-root --skip-plugins --skip-themes 2>/dev/null \
    | tr -d '\r' || true
  )

  if [ -z "$PROD_URL" ]; then
    warn "Could not detect siteurl from restored DB — skipping search-replace"
  elif [ "$PROD_URL" = "$LOCAL_URL" ]; then
    log "siteurl is already $LOCAL_URL — nothing to rewrite"
  else
    log "Rewriting URLs: $PROD_URL → $LOCAL_URL"
    compose exec -T wordpress wp search-replace "$PROD_URL" "$LOCAL_URL" \
      --allow-root --skip-plugins --skip-themes \
      --skip-columns=guid --all-tables --report-changed-only

    # Also rewrite protocol-less references (//host/...)
    prod_host="${PROD_URL#https://}"
    prod_host="${prod_host#http://}"
    local_host="${LOCAL_URL#http://}"
    if [ -n "$prod_host" ] && [ "$prod_host" != "$local_host" ]; then
      compose exec -T wordpress wp search-replace "//$prod_host" "//$local_host" \
        --allow-root --skip-plugins --skip-themes \
        --skip-columns=guid --all-tables --report-changed-only || true
    fi

    compose exec -T wordpress wp cache flush \
      --allow-root --skip-plugins --skip-themes 2>/dev/null || true
  fi
fi

log ""
log "Done."
log "  WordPress: $LOCAL_URL/wp-admin  (use the admin credentials from the restored dump)"
log "  GraphQL:   $LOCAL_URL/graphql"
log "  Frontend:  run 'pnpm dev' in another terminal to start Next.js on http://localhost:3000"
