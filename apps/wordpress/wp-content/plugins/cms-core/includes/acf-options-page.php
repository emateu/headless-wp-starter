<?php
/**
 * ACF Options Pages: Site Settings & Homepage Configuration.
 *
 * Only the page registration lives here — field groups are in acf-json/.
 */

add_action('acf/init', function () {
    if (! function_exists('acf_add_options_page')) {
        return;
    }

    acf_add_options_page([
        'page_title'      => 'Site Settings',
        'menu_title'      => 'Site Settings',
        'menu_slug'       => 'site-settings',
        'capability'      => 'manage_options',
        'redirect'        => false,
        'show_in_graphql' => true,
    ]);

    acf_add_options_sub_page([
        'page_title'      => 'Homepage',
        'menu_title'      => 'Homepage',
        'menu_slug'       => 'site-settings-homepage',
        'parent_slug'     => 'site-settings',
        'show_in_graphql' => true,
    ]);
});
