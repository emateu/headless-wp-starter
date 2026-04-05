#!/bin/sh
# Download the ACF Pro plugin using your license key.
# Run this once after cloning the repository.
#
# Usage:
#   ./setup-acf-pro.sh                   (interactive — prompts for key)
#   ACF_PRO_KEY=xxx ./setup-acf-pro.sh   (non-interactive — for CI)
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

cd "$SCRIPT_DIR"

ZIP="acf-pro.zip"

# If the zip already exists, ask before overwriting (interactive only)
if [ -f "$ZIP" ]; then
    if [ -n "${ACF_PRO_KEY:-}" ]; then
        echo "Updating $ZIP..."
    else
        printf "%s already exists. Re-download? [y/N] " "$ZIP"
        read -r answer
        case "$answer" in
            [yY]*) ;;
            *) echo "Skipped."; exit 0 ;;
        esac
    fi
fi

# Get the license key: env var or interactive prompt
key="${ACF_PRO_KEY:-}"
if [ -z "$key" ]; then
    printf "Enter your ACF Pro license key: "
    read -r key
fi

if [ -z "$key" ]; then
    echo "Error: no license key provided." >&2
    exit 1
fi

echo "Downloading ACF Pro..."

tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT

http_code=$(curl -sL -w "%{http_code}" -o "$tmp" \
    "https://connect.advancedcustomfields.com/v2/plugins/download?p=pro&k=${key}")

case "$http_code" in
    200)
        mv "$tmp" "$ZIP"
        echo "ACF Pro downloaded successfully ($(du -h "$ZIP" | cut -f1))."

        # Commit the plugin if we're in a git repo and something changed.
        if git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
            git -C "$REPO_ROOT" add "$SCRIPT_DIR/$ZIP"
            if ! git -C "$REPO_ROOT" diff --cached --quiet; then
                if git -C "$REPO_ROOT" ls-files --error-unmatch "$SCRIPT_DIR/$ZIP" >/dev/null 2>&1; then
                    git -C "$REPO_ROOT" commit -m "chore: update acf-pro plugin"
                else
                    git -C "$REPO_ROOT" commit -m "chore: add acf-pro plugin"
                fi
                echo "Committed acf-pro.zip to the repository."
            else
                echo "acf-pro.zip is already up to date."
            fi
        fi
        ;;
    401|403|404)
        msg=$(cat "$tmp" 2>/dev/null || true)
        detail=$(printf '%s' "$msg" | sed -n 's/.*"message"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
        echo "Error: ${detail:-Invalid license key.}" >&2
        exit 1
        ;;
    000)
        echo "Error: could not connect to ACF servers. Check your internet connection." >&2
        exit 1
        ;;
    *)
        echo "Error: download failed (HTTP ${http_code})." >&2
        exit 1
        ;;
esac
