<?php
/**
 * Plugin Name: CMS Core
 * Description: Core logic for the headless WP starter — ACF fields, content slices, options page, preview.
 * Version: 1.0.0
 */

// Only show ACF admin menus to administrators.
add_filter('acf/settings/show_admin', function () {
    return current_user_can('administrator');
});

// Disable Gutenberg editor — all content uses ACF Slices.
add_filter('use_block_editor_for_post_type', '__return_false');

// ACF Local JSON: load and save field groups from the plugin's acf-json directory.
add_filter('acf/settings/save_json', function () {
    return __DIR__ . '/acf-json';
});

add_filter('acf/settings/load_json', function (array $paths): array {
    $paths[] = __DIR__ . '/acf-json';
    return $paths;
});

// Enable GraphQL introspection in development only (needed for codegen).
add_filter('graphql_enable_introspection', function () {
    return getenv('WP_ENV') === 'development';
});

// Allow SVG uploads (with sanitization).
add_filter('upload_mimes', function (array $mimes): array {
    $mimes['svg'] = 'image/svg+xml';
    return $mimes;
});

add_filter('wp_handle_upload_prefilter', function (array $file): array {
    if ($file['type'] !== 'image/svg+xml') {
        return $file;
    }
    $svg = file_get_contents($file['tmp_name']);
    if ($svg === false) {
        $file['error'] = 'Could not read SVG file.';
        return $file;
    }

    $dom = new DOMDocument();
    libxml_use_internal_errors(true);
    if (!$dom->loadXML($svg)) {
        $file['error'] = 'Invalid SVG file.';
        return $file;
    }
    libxml_clear_errors();

    // Strip dangerous tags.
    $dangerous_tags = ['script', 'use', 'foreignObject', 'set', 'animate', 'animateTransform'];
    foreach ($dangerous_tags as $tag) {
        while ($node = $dom->getElementsByTagName($tag)->item(0)) {
            $node->parentNode->removeChild($node);
        }
    }

    // Strip event handler attributes (on*).
    $xpath = new DOMXPath($dom);
    foreach ($xpath->query('//*[@*[starts-with(name(), "on")]]') as $el) {
        foreach (iterator_to_array($el->attributes) as $attr) {
            if (stripos($attr->name, 'on') === 0) {
                $el->removeAttribute($attr->name);
            }
        }
    }

    // Strip href="javascript:..." attributes.
    foreach ($xpath->query('//*[@href]') as $el) {
        if (preg_match('/^\s*javascript\s*:/i', $el->getAttribute('href'))) {
            $el->removeAttribute('href');
        }
    }

    file_put_contents($file['tmp_name'], $dom->saveXML());
    return $file;
});

// Options pages (must stay in PHP — JSON only covers field groups).
require_once __DIR__ . '/includes/acf-options-page.php';
require_once __DIR__ . '/includes/preview.php';
