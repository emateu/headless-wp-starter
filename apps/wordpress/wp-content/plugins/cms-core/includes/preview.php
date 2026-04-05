<?php
/**
 * Preview URL filter.
 * Redirects the WordPress "Preview" button to the Next.js frontend draft mode endpoint.
 */

add_filter('preview_post_link', function (string $preview_link, WP_Post $post): string {
    $frontend_url = defined('FRONTEND_URL') ? FRONTEND_URL : getenv('FRONTEND_URL');

    if (! $frontend_url) {
        return $preview_link;
    }

    $preview_secret = defined('PREVIEW_SECRET') ? PREVIEW_SECRET : getenv('PREVIEW_SECRET');

    return add_query_arg(
        [
            'secret' => $preview_secret,
            'id'     => $post->ID,
        ],
        rtrim($frontend_url, '/') . '/api/preview'
    );
}, 10, 2);
