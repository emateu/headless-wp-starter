#!/bin/bash
set -eu

# ─────────────────────────────────────────────────────────────
# Headless WP Starter — WordPress init script
# Runs via WP-CLI after WordPress is available.
# Idempotent: safe to re-run without creating duplicates.
# ─────────────────────────────────────────────────────────────

# ── 1. CORE INSTALL ─────────────────────────────────────────

if ! wp core is-installed --allow-root 2>/dev/null; then
  wp core install \
    --url="${WP_URL:-http://localhost}" \
    --title="${WP_TITLE:-My Site}" \
    --admin_user="${WP_ADMIN_USER:?}" \
    --admin_password="${WP_ADMIN_PASSWORD:?}" \
    --admin_email="${WP_ADMIN_EMAIL:?}" \
    --skip-email \
    --allow-root
  echo "WordPress installed."
else
  echo "WordPress already installed, skipping."
fi

# ── 2. THEME & PLUGINS ──────────────────────────────────────

wp theme activate headless --allow-root 2>/dev/null || true
wp plugin activate --all --allow-root 2>/dev/null || true

# Enable public introspection in WPGraphQL (needed for codegen in dev).
if [ "${WP_ENV:-}" = "development" ]; then
  wp eval '
  $settings = get_option("graphql_general_settings", []);
  if (($settings["public_introspection_enabled"] ?? "") !== "on") {
      $settings["public_introspection_enabled"] = "on";
      update_option("graphql_general_settings", $settings);
      echo "WPGraphQL public introspection enabled.\n";
  }
  ' --allow-root
fi

# Import ACF field groups from Local JSON into the database.
wp eval '
$dir = WP_PLUGIN_DIR . "/cms-core/acf-json";
if (is_dir($dir) && function_exists("acf_import_field_group")) {
    foreach (glob("$dir/*.json") as $file) {
        $group = json_decode(file_get_contents($file), true);
        if (!$group || empty($group["key"])) continue;
        $exists = get_posts(["post_type" => "acf-field-group", "name" => $group["key"], "posts_per_page" => 1, "post_status" => "any"]);
        if ($exists) continue;
        acf_import_field_group($group);
    }
    echo "ACF field groups synced from JSON.\n";
}
' --allow-root

# ── 3. PERMALINKS ───────────────────────────────────────────

wp rewrite structure '/%postname%/' --allow-root
wp rewrite flush --allow-root

# ── 4. SAMPLE CONTENT (dev only) ────────────────────────────

if [ "${WP_ENV:-}" != "development" ]; then
  echo "Skipping sample content (WP_ENV=${WP_ENV:-unset})."
elif wp option get portal_sample_content --allow-root 2>/dev/null | grep -q "1"; then
  echo "Sample content already exists, skipping content creation."
else

  # ── 4a. Categories ─────────────────────────────────────────
  echo "Creating categories..."
  wp term create category "Politics"   --slug=politics   --description="National and international politics news" --allow-root 2>/dev/null || true
  wp term create category "Economy"    --slug=economy    --description="Economy, finance, and markets" --allow-root 2>/dev/null || true
  wp term create category "Sports"     --slug=sports     --description="National and international sports" --allow-root 2>/dev/null || true
  wp term create category "Technology" --slug=technology --description="Technology, science, and innovation" --allow-root 2>/dev/null || true

  # ── 4b. Tags ───────────────────────────────────────────────
  echo "Creating tags..."
  wp term create post_tag "Elections 2026"           --slug=elections-2026          --allow-root 2>/dev/null || true
  wp term create post_tag "Dollar"                   --slug=dollar                  --allow-root 2>/dev/null || true
  wp term create post_tag "Champions League"         --slug=champions-league        --allow-root 2>/dev/null || true
  wp term create post_tag "Artificial Intelligence"  --slug=artificial-intelligence --allow-root 2>/dev/null || true
  wp term create post_tag "Climate"                  --slug=climate                 --allow-root 2>/dev/null || true
  wp term create post_tag "Trade Bloc"               --slug=trade-bloc              --allow-root 2>/dev/null || true

  # ── 4c. Content (images, posts, pages, options via PHP) ────
  echo "Creating sample content..."

  cat > /tmp/portal-sample-content.php <<'SAMPLEPHP'
<?php
// ── Helper: create placeholder image via GD ─────────────────
function portal_img($name, $r, $g, $b, $w = 1200, $h = 800) {
    $upload_dir = wp_upload_dir();
    $filename = sanitize_file_name($name) . '.png';
    $filepath = $upload_dir['path'] . '/' . $filename;

    $img = imagecreatetruecolor($w, $h);
    $bg  = imagecolorallocate($img, $r, $g, $b);
    imagefill($img, 0, 0, $bg);

    // Center label
    $white = imagecolorallocate($img, 255, 255, 255);
    $label = strtoupper(str_replace('-', ' ', $name));
    $fw    = imagefontwidth(5);
    imagestring($img, 5, max(0, ($w - strlen($label) * $fw) / 2), intval($h / 2) - 8, $label, $white);

    imagepng($img, $filepath, 6);
    imagedestroy($img);

    $att_id = wp_insert_attachment([
        'post_mime_type' => 'image/png',
        'post_title'     => str_replace('-', ' ', $name),
        'post_status'    => 'inherit',
    ], $filepath);

    require_once ABSPATH . 'wp-admin/includes/image.php';
    wp_update_attachment_metadata($att_id, wp_generate_attachment_metadata($att_id, $filepath));
    update_post_meta($att_id, '_wp_attachment_image_alt', str_replace('-', ' ', $name));

    return $att_id;
}

// ── Helper: create post with ACF fields ─────────────────────
function portal_post($a) {
    $post_id = wp_insert_post([
        'post_type'   => 'post',
        'post_title'  => $a['title'],
        'post_name'   => $a['slug'],
        'post_status' => 'publish',
        'post_date'   => $a['date'],
    ]);
    if (is_wp_error($post_id)) { echo "ERROR creating {$a['slug']}\n"; return 0; }

    $cat = get_term_by('slug', $a['category'], 'category');
    if ($cat) wp_set_post_categories($post_id, [$cat->term_id]);

    wp_set_post_tags($post_id, $a['tags']);

    if (!empty($a['image'])) set_post_thumbnail($post_id, $a['image']);

    update_field('subtitle', $a['subtitle'], $post_id);
    if (!empty($a['featured'])) update_field('featured', true, $post_id);
    update_field('field_content_slices', $a['slices'], $post_id);

    echo "  Post #{$post_id}: {$a['slug']}\n";
    return $post_id;
}

// ── Create placeholder images ───────────────────────────────
echo "Creating placeholder images...\n";
$im = [];
$im['reforma']     = portal_img('tax-reform',          220, 38,  38);
$im['banco']       = portal_img('central-bank',         37, 99, 235);
$im['mundial']     = portal_img('world-cup-2026',       22,163,  74);
$im['startups']    = portal_img('ai-startups',         124, 58, 237);
$im['dakar']       = portal_img('rally-dakar',         234, 88,  12);
$im['chip']        = portal_img('quantum-chip',          8,145, 178);
$im['inflacion']   = portal_img('march-inflation',     202,138,   4);
$im['periodismo']  = portal_img('journalism-tech',     190, 24,  93);
$im['elecciones']  = portal_img('elections-debate',    185, 28,  28);
$im['libertadores']= portal_img('copa-libertadores',    21,128,  61);
// Gallery extras
$im['gal1']        = portal_img('dakar-stage-1',        99,102, 241);
$im['gal2']        = portal_img('dakar-stage-2',        13,148, 136);
$im['gal3']        = portal_img('dakar-stage-3',       217,119,   6);
// Pages
$im['about']       = portal_img('about-hero',           30, 64, 175);

$now = time();
$day = DAY_IN_SECONDS;

// ── POST 1: rich_text only (Politics) ───────────────────────
echo "Creating posts...\n";

portal_post([
    'title'    => 'Tax reform advances in the Senate with bipartisan support',
    'slug'     => 'tax-reform-senate',
    'subtitle' => 'The bill received backing from three legislative blocs and is expected to pass next week.',
    'category' => 'politics',
    'tags'     => ['Elections 2026'],
    'image'    => $im['reforma'],
    'date'     => date('Y-m-d H:i:s', $now - 14 * $day),
    'slices'   => [
        [
            'acf_fc_layout' => 'rich_text',
            'content' => '<h2>An unexpected consensus</h2>'
                . '<p>The Senate committee approved the tax reform bill with the support of three legislative blocs, something political analysts had not anticipated. The initiative aims to simplify the tax system and reduce evasion.</p>'
                . '<p>The Finance Minister praised the agreement and stressed that the reform is "a fundamental step toward modernizing the country\'s tax structure." Key changes include the unification of tax rates, the elimination of distortive taxes, and the creation of incentives for small business formalization.</p>'
                . '<h3>Key points of the bill</h3>'
                . '<p>Among the most notable measures are the gradual reduction of corporate income tax, the simplification of the small-business tax regime, and the implementation of mandatory electronic invoicing for all taxpayers.</p>'
                . '<p>The opposition, while supporting the committee report, announced it will propose amendments on the floor to protect the most vulnerable sectors from the impact of the tax transition.</p>',
        ],
    ],
]);

// ── POST 2: rich_text only (Economy) ────────────────────────

portal_post([
    'title'    => 'Central Bank holds benchmark rate at 4.5%',
    'slug'     => 'central-bank-benchmark-rate',
    'subtitle' => 'The decision seeks to balance inflation control with economic growth stimulus in the second quarter.',
    'category' => 'economy',
    'tags'     => ['Dollar'],
    'image'    => $im['banco'],
    'date'     => date('Y-m-d H:i:s', $now - 12 * $day),
    'slices'   => [
        [
            'acf_fc_layout' => 'rich_text',
            'content' => '<h2>Stability as a priority</h2>'
                . '<p>The Central Bank board unanimously decided to hold the monetary policy rate at 4.5%, in line with market expectations. The institution noted that core inflation shows signs of deceleration, although risks related to food and energy prices persist.</p>'
                . '<p>Analysts surveyed agreed the decision was expected, but differ on the outlook for the second half of the year. While some anticipate a 25-basis-point cut in July, others believe the bank will remain cautious until the full effects of fiscal policy become apparent.</p>'
                . '<h3>Impact on the exchange rate</h3>'
                . '<p>The dollar traded steady after the announcement, quoted at $920 on the official market. Currency traders noted the decision was already priced in and do not expect significant moves in the short term.</p>',
        ],
    ],
]);

// ── POST 3: rich_text + image + quote (Sports) ─────────────

portal_post([
    'title'    => 'Argentina qualifies for the 2026 World Cup after victory in Lima',
    'slug'     => 'argentina-world-cup-2026',
    'subtitle' => 'The national team secured its place in the World Cup with a memorable performance at the Estadio Nacional.',
    'category' => 'sports',
    'tags'     => ['Champions League'],
    'image'    => $im['mundial'],
    'date'     => date('Y-m-d H:i:s', $now - 10 * $day),
    'slices'   => [
        [
            'acf_fc_layout' => 'rich_text',
            'content' => '<h2>A historic night in Lima</h2>'
                . '<p>Argentina sealed their qualification for the 2026 World Cup with a convincing 3-1 victory over Peru at the Estadio Nacional in Lima. Goals from Alvarez, Garnacho, and Echeverri capped a performance fans will not soon forget.</p>'
                . '<p>The team, managed by Scaloni, displayed impeccable collective play, with ball dominance and quick transitions that dismantled the Peruvian defense from the opening minutes.</p>',
        ],
        [
            'acf_fc_layout' => 'image',
            'image'    => $im['mundial'],
            'caption'  => 'The Argentine national team celebrates qualification at the Estadio Nacional in Lima.',
            'alt_text' => 'Argentine players celebrating',
        ],
        [
            'acf_fc_layout' => 'quote',
            'text'   => 'This squad has something special. Every match is a final and the players feel it that way. I am proud of what we achieved.',
            'author' => 'Lionel Scaloni, Argentina head coach',
        ],
    ],
]);

// ── POST 4: rich_text + image + quote (Technology) ──────────

portal_post([
    'title'    => 'AI startups raise record funding in Latin America',
    'slug'     => 'ai-startups-latin-america',
    'subtitle' => 'The regional tech ecosystem experiences unprecedented growth driven by artificial intelligence.',
    'category' => 'technology',
    'tags'     => ['Artificial Intelligence'],
    'image'    => $im['startups'],
    'date'     => date('Y-m-d H:i:s', $now - 9 * $day),
    'slices'   => [
        [
            'acf_fc_layout' => 'rich_text',
            'content' => '<h2>The AI boom in the region</h2>'
                . '<p>Artificial intelligence startups in Latin America raised over $2.8 billion in the first quarter of 2026, a 340% increase compared to the same period last year. Brazil, Mexico, and Argentina lead the investment rankings.</p>'
                . '<p>A report by the Latin American Venture Capital Association highlights that health, fintech, and agritech are the sectors attracting the most investment, with solutions that combine advanced language models with local data.</p>',
        ],
        [
            'acf_fc_layout' => 'image',
            'image'    => $im['startups'],
            'caption'  => 'The AI startup ecosystem is growing rapidly across the region.',
            'alt_text' => 'Artificial intelligence startups',
        ],
        [
            'acf_fc_layout' => 'quote',
            'text'   => 'Latin America has an enormous competitive advantage: top-tier technical talent, competitive operating costs, and real problems to solve with AI.',
            'author' => 'Maria Fernanda Lopez, director of LatAm Ventures',
        ],
    ],
]);

// ── POST 5: rich_text + gallery (Sports) ────────────────────

portal_post([
    'title'    => 'The best images from the 2026 Rally Dakar',
    'slug'     => 'best-images-rally-dakar-2026',
    'subtitle' => 'A selection of the most striking photographs from the most demanding competition in world motorsport.',
    'category' => 'sports',
    'tags'     => ['Champions League', 'Climate'],
    'image'    => $im['dakar'],
    'date'     => date('Y-m-d H:i:s', $now - 8 * $day),
    'slices'   => [
        [
            'acf_fc_layout' => 'rich_text',
            'content' => '<h2>Adrenaline in the desert</h2>'
                . '<p>The 2026 Rally Dakar produced spectacular images across its 14 stages. From the dunes of Saudi Arabia to the rocky canyons, competitors faced one of the most demanding routes in the history of the competition.</p>'
                . '<p>This edition was particularly challenging due to extreme weather conditions, with sandstorms that forced the partial suspension of two stages.</p>',
        ],
        [
            'acf_fc_layout' => 'gallery',
            'images' => [$im['dakar'], $im['gal1'], $im['gal2'], $im['gal3']],
        ],
    ],
]);

// ── POST 6: rich_text + embed (Technology) ──────────────────

portal_post([
    'title'    => 'How Google\'s new quantum chip works',
    'slug'     => 'google-quantum-chip',
    'subtitle' => 'The tech giant unveiled a processor that promises to revolutionize computing in the years ahead.',
    'category' => 'technology',
    'tags'     => ['Artificial Intelligence'],
    'image'    => $im['chip'],
    'date'     => date('Y-m-d H:i:s', $now - 7 * $day),
    'slices'   => [
        [
            'acf_fc_layout' => 'rich_text',
            'content' => '<h2>A quantum leap</h2>'
                . '<p>Google unveiled its new quantum processor Willow, capable of performing in minutes calculations that would take the most powerful supercomputers thousands of years. The breakthrough represents a milestone in the race for quantum supremacy.</p>'
                . '<p>The chip uses a 105-qubit architecture with a significantly lower error rate than previous generations, bringing it closer to practical applications in cryptography, drug design, and logistics optimization.</p>',
        ],
        [
            'acf_fc_layout' => 'embed',
            'url' => 'https://www.youtube.com/watch?v=aircAruvnKk',
        ],
    ],
]);

// ── POST 7: rich_text + infobox (Economy) ───────────────────

portal_post([
    'title'    => 'March inflation: the numbers that worry analysts',
    'slug'     => 'march-inflation-analysis',
    'subtitle' => 'First-quarter economic indicators reveal a trend that demands urgent government attention.',
    'category' => 'economy',
    'tags'     => ['Dollar', 'Trade Bloc'],
    'image'    => $im['inflacion'],
    'date'     => date('Y-m-d H:i:s', $now - 5 * $day),
    'slices'   => [
        [
            'acf_fc_layout' => 'rich_text',
            'content' => '<h2>Warning signs</h2>'
                . '<p>The consumer price index posted a 3.2% increase in March, exceeding analyst projections of 2.8%. It marks the second consecutive month of acceleration and puts pressure on the government\'s annual target.</p>'
                . '<p>The categories with the greatest impact were food and beverages (+4.1%), transportation (+3.8%), and public utilities (+5.2%), the latter driven by the tariff adjustment scheduled for the first quarter.</p>',
        ],
        [
            'acf_fc_layout' => 'infobox',
            'title'   => 'Key indicators — March 2026',
            'content' => '<ul><li><strong>Headline CPI:</strong> +3.2% monthly</li><li><strong>Core CPI:</strong> +2.9% monthly</li><li><strong>Food and beverages:</strong> +4.1%</li><li><strong>Cumulative inflation (12 months):</strong> 28.5%</li><li><strong>Official annual target:</strong> 25%</li><li><strong>Exchange rate:</strong> $920 (official)</li></ul>',
        ],
    ],
]);

// ── POST 8: ALL slice types — showcase (Technology) ─────────

portal_post([
    'title'    => 'Special report: How technology is transforming journalism',
    'slug'     => 'technology-transforming-journalism',
    'subtitle' => 'A tour of the tools and trends that are changing how news is produced and consumed.',
    'category' => 'technology',
    'tags'     => ['Artificial Intelligence', 'Elections 2026'],
    'image'    => $im['periodismo'],
    'date'     => date('Y-m-d H:i:s', $now - 4 * $day),
    'slices'   => [
        [
            'acf_fc_layout' => 'rich_text',
            'content' => '<h2>The digital revolution in newsrooms</h2>'
                . '<p>Journalism is undergoing an unprecedented transformation. From automated news writing to AI-powered fact-checking, newsrooms around the world are adopting tools that a decade ago seemed like science fiction.</p>'
                . '<p>In this special report, we explore the key innovations redefining the media industry in Latin America and beyond.</p>',
        ],
        [
            'acf_fc_layout' => 'image',
            'image'    => $im['periodismo'],
            'caption'  => 'A modern newsroom where journalists and artificial intelligence tools work side by side.',
            'alt_text' => 'Tech-enabled media newsroom',
        ],
        [
            'acf_fc_layout' => 'quote',
            'text'   => 'Artificial intelligence will not replace journalists, but journalists who use AI will replace those who do not.',
            'author' => 'Martin Garcia, editor-in-chief of Digital Media',
        ],
        [
            'acf_fc_layout' => 'infobox',
            'title'   => 'AI adoption in Latin American media',
            'content' => '<ul><li><strong>72%</strong> of newsrooms use some form of AI tool</li><li><strong>45%</strong> automate headline generation</li><li><strong>38%</strong> use automated fact-checking</li><li><strong>61%</strong> plan to increase their technology investment in 2026</li></ul>',
        ],
        [
            'acf_fc_layout' => 'gallery',
            'images' => [$im['periodismo'], $im['chip'], $im['startups']],
        ],
        [
            'acf_fc_layout' => 'embed',
            'url' => 'https://www.youtube.com/watch?v=aircAruvnKk',
        ],
    ],
]);

// ── POST 9: FEATURED — rich_text + image (Politics) ────────

$post9 = portal_post([
    'title'    => 'Elections 2026: candidates unveil their economic proposals',
    'slug'     => 'elections-2026-economic-proposals',
    'subtitle' => 'In a televised debate, the leading contenders laid out their plans to revitalize the national economy.',
    'category' => 'politics',
    'tags'     => ['Elections 2026', 'Dollar'],
    'image'    => $im['elecciones'],
    'date'     => date('Y-m-d H:i:s', $now - 2 * $day),
    'featured' => true,
    'slices'   => [
        [
            'acf_fc_layout' => 'rich_text',
            'content' => '<h2>The great economic debate</h2>'
                . '<p>The three leading presidential candidates faced off in the first televised debate focused exclusively on economic proposals. Over more than two hours, the contenders presented their views on fiscal, monetary, trade, and labor policy.</p>'
                . '<p>The ruling-party candidate defended the continuity of the stabilization program, while the opposition proposed more aggressive structural reforms, including a comprehensive labor reform and the renegotiation of trade agreements within the regional bloc.</p>'
                . '<h3>Key debate topics</h3>'
                . '<p>The issues that sparked the most confrontation were tax policy, the future of state-owned enterprises, and the trade integration strategy. Analysts agreed that the debate raised the level of public discussion on the economy.</p>',
        ],
        [
            'acf_fc_layout' => 'image',
            'image'    => $im['elecciones'],
            'caption'  => 'The candidates during the televised economic debate.',
            'alt_text' => 'Presidential debate 2026',
        ],
    ],
]);

// ── POST 10: FEATURED — rich_text + quote (Sports) ─────────

$post10 = portal_post([
    'title'    => 'Copa Libertadores: tactical analysis of the semifinals',
    'slug'     => 'copa-libertadores-semifinals-analysis',
    'subtitle' => 'Experts break down the tactical keys that will define the most anticipated matchups of the continental tournament.',
    'category' => 'sports',
    'tags'     => ['Champions League'],
    'image'    => $im['libertadores'],
    'date'     => date('Y-m-d H:i:s', $now - 1 * $day),
    'featured' => true,
    'slices'   => [
        [
            'acf_fc_layout' => 'rich_text',
            'content' => '<h2>Fiery semifinals</h2>'
                . '<p>The 2026 Copa Libertadores reaches its most thrilling stage with four teams representing the best of South American football. The semifinals promise fascinating tactical clashes between contrasting styles of play.</p>'
                . '<p>In the first leg, the defending champion faces a team that has impressed with its defensive solidity and lethal counter-attacking. In the second, two continental giants test each other in what promises to be a battle of possession versus directness.</p>'
                . '<h3>Tactical keys</h3>'
                . '<p>Analysts agree that a high press and the ability to transition quickly will be decisive. The teams that best manage the key moments of each match and capitalize on set pieces will have the edge in such evenly matched knockout ties.</p>',
        ],
        [
            'acf_fc_layout' => 'quote',
            'text'   => 'At this stage there are no favorites. All four teams earned their place on merit and any of them can lift the trophy. It will be a historic showdown.',
            'author' => 'Roberto Martinez, tactical analyst at ESPN',
        ],
    ],
]);

// ── PAGES ───────────────────────────────────────────────────
echo "Creating pages...\n";

// About page
$about_id = wp_insert_post([
    'post_type'   => 'page',
    'post_title'  => 'About',
    'post_name'   => 'about',
    'post_status' => 'publish',
]);
if (!is_wp_error($about_id)) {
    update_field('field_content_slices', [
        [
            'acf_fc_layout' => 'hero',
            'title'    => 'About News Portal',
            'subtitle' => 'Reliable, independent, and timely information for our readers.',
            'image'    => $im['about'],
            'cta_text' => '',
            'cta_url'  => '',
        ],
        [
            'acf_fc_layout' => 'rich_text',
            'content' => '<h2>Our mission</h2>'
                . '<p>News Portal is a digital outlet committed to quality journalism. Our goal is to report with precision, context, and depth on the issues that matter to our community.</p>'
                . '<h3>Who we are</h3>'
                . '<p>We are a team of journalists, editors, and technology professionals who believe in the power of journalism to strengthen democracy and empower citizens with verified information.</p>'
                . '<h3>Our values</h3>'
                . '<ul><li><strong>Independence:</strong> We answer to no political or economic interests.</li><li><strong>Accuracy:</strong> We verify every fact before publishing.</li><li><strong>Transparency:</strong> We correct our errors publicly and promptly.</li><li><strong>Innovation:</strong> We leverage technology to improve the news experience.</li></ul>',
        ],
    ], $about_id);
    echo "  Page: about (ID: $about_id)\n";
}

// Contact page
$contact_id = wp_insert_post([
    'post_type'   => 'page',
    'post_title'  => 'Contact',
    'post_name'   => 'contact',
    'post_status' => 'publish',
]);
if (!is_wp_error($contact_id)) {
    update_field('field_content_slices', [
        [
            'acf_fc_layout' => 'rich_text',
            'content' => '<h2>Contact</h2>'
                . '<p>Have a news tip, suggestion, or question? We would love to hear from you.</p>'
                . '<h3>Newsroom</h3>'
                . '<p>To submit news, press releases, or editorial suggestions:</p>'
                . '<p><strong>Email:</strong> newsroom@newsportal.com</p>'
                . '<h3>Advertising</h3>'
                . '<p>For business inquiries and advertising opportunities:</p>'
                . '<p><strong>Email:</strong> advertising@newsportal.com</p>'
                . '<h3>Social media</h3>'
                . '<p>Follow us on social media to stay up to date with the latest news:</p>'
                . '<ul><li>Twitter: @newsportal</li><li>Instagram: @newsportal</li></ul>',
        ],
    ], $contact_id);
    echo "  Page: contact (ID: $contact_id)\n";
}

// ── OPTIONS PAGE DEFAULTS ───────────────────────────────────
echo "Setting options page defaults...\n";

update_field('social_links', [
    ['platform' => 'twitter',   'url' => 'https://twitter.com/newsportal'],
    ['platform' => 'instagram', 'url' => 'https://instagram.com/newsportal'],
], 'option');

update_field('copyright_text', '© 2026 News Portal. All rights reserved.', 'option');
update_field('homepage_layout', 'layout_a', 'option');

// Set logo to the about hero image as placeholder
update_field('site_logo', $im['about'], 'option');

echo "Sample content creation complete.\n";
SAMPLEPHP

  wp eval-file /tmp/portal-sample-content.php --allow-root
  rm -f /tmp/portal-sample-content.php

  wp option update portal_sample_content 1 --allow-root
fi

# ── 5. MENUS (dev only) ──────────────────────────────────────

if [ "${WP_ENV:-}" = "development" ]; then

# Main navigation menu
if ! wp menu list --format=csv --allow-root 2>/dev/null | grep -q "Main Navigation"; then
  wp menu create "Main Navigation" --allow-root
fi
MAIN_MENU_ID=$(wp menu list --fields=term_id,name --format=csv --allow-root | grep "Main Navigation" | cut -d',' -f1)
if [ -n "$MAIN_MENU_ID" ]; then
  wp menu location assign "$MAIN_MENU_ID" main --allow-root 2>/dev/null || true
  MAIN_ITEMS=$(wp menu item list "$MAIN_MENU_ID" --format=ids --allow-root 2>/dev/null)
  if [ -z "$MAIN_ITEMS" ]; then
    wp menu item add-custom "$MAIN_MENU_ID" "Politics"   "/category/politics"   --allow-root
    wp menu item add-custom "$MAIN_MENU_ID" "Economy"    "/category/economy"    --allow-root
    wp menu item add-custom "$MAIN_MENU_ID" "Sports"     "/category/sports"     --allow-root
    wp menu item add-custom "$MAIN_MENU_ID" "Technology" "/category/technology" --allow-root
    echo "Main menu created with category items."
  fi
fi

# Footer navigation menu
if ! wp menu list --format=csv --allow-root 2>/dev/null | grep -q "Footer Navigation"; then
  wp menu create "Footer Navigation" --allow-root
fi
FOOTER_MENU_ID=$(wp menu list --fields=term_id,name --format=csv --allow-root | grep "Footer Navigation" | cut -d',' -f1)
if [ -n "$FOOTER_MENU_ID" ]; then
  wp menu location assign "$FOOTER_MENU_ID" footer --allow-root 2>/dev/null || true
  FOOTER_ITEMS=$(wp menu item list "$FOOTER_MENU_ID" --format=ids --allow-root 2>/dev/null)
  if [ -z "$FOOTER_ITEMS" ]; then
    wp menu item add-custom "$FOOTER_MENU_ID" "About"           "/about"   --allow-root
    wp menu item add-custom "$FOOTER_MENU_ID" "Contact"         "/contact" --allow-root
    wp menu item add-custom "$FOOTER_MENU_ID" "Terms of Service" "/terms"   --allow-root
    wp menu item add-custom "$FOOTER_MENU_ID" "Privacy Policy"  "/privacy" --allow-root
    echo "Footer menu created with items."
  fi
fi # end footer menu

fi # end WP_ENV=development

# Fix uploads ownership (this script runs as root and may create subdirectories)
chown -R www-data:www-data /var/www/html/wp-content/uploads 2>/dev/null || true

echo "WordPress init complete."
