#!/bin/sh
# Test R2 connectivity from the VPS.
# Usage: ssh deploy@<VPS_IP> "bash -s" < infra/backup/test-r2.sh
set -eu

cd /opt/app

# Load .env
set -a
. ./.env
set +a

echo "Testing R2 connection (bucket: ${R2_BUCKET})..."

docker run --rm \
  -e RCLONE_CONFIG_R2_TYPE=s3 \
  -e RCLONE_CONFIG_R2_PROVIDER=Cloudflare \
  -e RCLONE_CONFIG_R2_ACCESS_KEY_ID="${R2_ACCESS_KEY}" \
  -e RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="${R2_SECRET_KEY}" \
  -e RCLONE_CONFIG_R2_ENDPOINT="${R2_ENDPOINT}" \
  -e RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true \
  rclone/rclone:latest lsd "r2:${R2_BUCKET}/"

echo "R2 connection OK."
