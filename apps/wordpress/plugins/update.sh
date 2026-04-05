#!/bin/sh
# Update vendored WordPress plugin zips to their latest versions.
# ACF Pro is handled separately — run setup-acf-pro.sh for that.
# Usage: ./update.sh
set -eu

cd "$(dirname "$0")"

echo "Downloading wp-graphql..."
curl -sLO https://downloads.wordpress.org/plugin/wp-graphql.zip

echo "Downloading wpgraphql-acf..."
curl -sLO https://downloads.wordpress.org/plugin/wpgraphql-acf.zip

echo "Downloading amazon-s3-and-cloudfront (WP Offload Media Lite)..."
curl -sLO https://downloads.wordpress.org/plugin/amazon-s3-and-cloudfront.zip

echo "Done. Updated zips:"
ls -lh *.zip

if [ ! -f acf-pro.zip ]; then
    echo ""
    echo "Note: acf-pro.zip not found. Run 'pnpm wp:setup-acf' to download it."
fi
