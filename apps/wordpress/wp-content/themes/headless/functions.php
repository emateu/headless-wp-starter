<?php

// Redirect all frontend requests to the WP admin dashboard.
// GraphQL, REST API, admin, AJAX, and cron requests are excluded.
add_action('template_redirect', function () {
    wp_redirect(admin_url());
    exit;
});

// Register navigation menus for header and footer.
add_action('after_setup_theme', function () {
    register_nav_menus([
        'main'   => 'Main Navigation',
        'footer' => 'Footer Navigation',
    ]);

    add_theme_support('post-thumbnails');
});
