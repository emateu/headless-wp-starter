#!/bin/bash
# Sync plugins/themes from the image's baked-in snapshot into the runtime
# wp-content dir, then hand off to the WordPress entrypoint.
#
# Entries that are bind mounts are skipped in both the wipe and the copy: a
# `rm -rf` on a glob would descend into the mount and unlink files on the
# host, and the follow-up `cp -r` would overwrite the host tree with the
# image snapshot on every container start.
set -e

sync_dir() {
    local src="$1" dst="$2"

    mkdir -p "$dst"

    for entry in "$dst"/*; do
        [ -e "$entry" ] || continue
        if mountpoint -q "$entry"; then
            continue
        fi
        rm -rf "$entry"
    done

    for entry in "$src"/*; do
        [ -e "$entry" ] || continue
        local name
        name=$(basename "$entry")
        if mountpoint -q "$dst/$name"; then
            continue
        fi
        cp -r "$entry" "$dst/"
    done
}

sync_dir /usr/src/wordpress/wp-content/plugins /var/www/html/wp-content/plugins
sync_dir /usr/src/wordpress/wp-content/themes  /var/www/html/wp-content/themes

mkdir -p /var/www/html/wp-content/uploads
chown -R www-data:www-data /var/www/html/wp-content/uploads

exec docker-entrypoint.sh "$@"
