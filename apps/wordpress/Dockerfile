FROM wordpress:6.9-php8.3-apache

# Allow uploads up to 25 MB
RUN printf 'upload_max_filesize = 25M\npost_max_size = 25M\n' \
    > /usr/local/etc/php/conf.d/uploads.ini

# Install WP-CLI
ADD https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar /usr/local/bin/wp
RUN chmod +x /usr/local/bin/wp

# Remove default plugins that are not needed in a headless setup
RUN rm -rf /usr/src/wordpress/wp-content/plugins/akismet \
           /usr/src/wordpress/wp-content/plugins/hello.php

# Install plugins from vendored zips (upgrade by replacing the zip and rebuilding)
COPY plugins/*.zip /tmp/plugins/
RUN apt-get update && apt-get install -y --no-install-recommends unzip \
    && for zip in /tmp/plugins/*.zip; do unzip "$zip" -d /usr/src/wordpress/wp-content/plugins/; done \
    && rm -rf /tmp/plugins \
    && apt-get purge -y unzip && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Copy custom headless theme
COPY wp-content/themes/headless/ /usr/src/wordpress/wp-content/themes/headless/

# Copy custom plugin stub
COPY wp-content/plugins/cms-core/ /usr/src/wordpress/wp-content/plugins/cms-core/

# Entrypoint: sync plugins/themes, fix permissions, then run WordPress entrypoint
COPY --chmod=755 sync-wp-content.sh /usr/local/bin/sync-wp-content.sh

# WP init script: configures WordPress via WP-CLI (idempotent, safe to re-run)
COPY --chmod=755 wp-init.sh /usr/local/bin/wp-init.sh

ENTRYPOINT ["sync-wp-content.sh"]
CMD ["apache2-foreground"]
