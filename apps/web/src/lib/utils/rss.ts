import type { GetPostsForFeedQuery } from "~/lib/graphql/__generated__/graphql";
import { stripHtml } from "./html";

type FeedPost = NonNullable<GetPostsForFeedQuery["posts"]>["nodes"][number];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface RssFeedOptions {
  title: string;
  description: string;
  siteUrl: string;
  feedUrl: string;
  posts: FeedPost[];
}

export function buildRssFeed({
  title,
  description,
  siteUrl,
  feedUrl,
  posts,
}: RssFeedOptions): string {
  const items = posts
    .map((post) => {
      const postDescription =
        post.articleFields?.subtitle || stripHtml(post.excerpt ?? "");
      const categories = post.categories?.nodes ?? [];
      const categoryTags = categories
        .map((c) => `      <category>${escapeXml(c.name ?? "")}</category>`)
        .join("\n");

      return `    <item>
      <title>${escapeXml(post.title ?? "")}</title>
      <link>${siteUrl}/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/${post.slug}</guid>
      <description>${escapeXml(postDescription)}</description>
      <pubDate>${post.date ? new Date(post.date).toUTCString() : ""}</pubDate>
${categoryTags}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(description)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}
