import type { NextConfig } from "next";

const cacheProfiles = {
  home: {
    stale: 120, // 2min — CDN serves without hitting origin
    revalidate: 120, // 2min — server revalidates WP data
    expire: 600, // 10min — max stale serving window
  },
  article: {
    stale: 300, // 5min
    revalidate: 300, // 5min
    expire: 3600, // 1h
  },
  listing: {
    stale: 120, // 2min
    revalidate: 120, // 2min
    expire: 600, // 10min
  },
  static: {
    stale: 3600, // 1h
    revalidate: 3600, // 1h
    expire: 86400, // 24h
  },
};

function cdnCacheHeader(profile: keyof typeof cacheProfiles) {
  const { stale, expire } = cacheProfiles[profile];
  return `public, s-maxage=${stale}, stale-while-revalidate=${expire - stale}`;
}

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  async headers() {
    // Last matching rule wins for same header key — order matters
    return [
      {
        // Default: article profile (catch-all, applied first)
        source: "/:path*",
        headers: [{ key: "Cache-Control", value: cdnCacheHeader("article") }],
      },
      {
        // Home
        source: "/",
        headers: [{ key: "Cache-Control", value: cdnCacheHeader("home") }],
      },
      {
        // Listings
        source: "/(category|tag)/:path*",
        headers: [{ key: "Cache-Control", value: cdnCacheHeader("listing") }],
      },
      {
        source: "/search",
        headers: [{ key: "Cache-Control", value: cdnCacheHeader("listing") }],
      },
      {
        // Preview and API: never cache (must be last to override catch-all)
        source: "/(preview|api)/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
  cacheLife: cacheProfiles,
  images: {
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
