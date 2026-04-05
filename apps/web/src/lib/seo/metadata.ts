import type { Metadata } from "next";
import { labels } from "~/lib/config/labels";
import { getSiteUrl } from "~/lib/config/site";
import type { PostDetailFieldsFragment } from "~/lib/graphql/__generated__/graphql";
import { stripHtml } from "~/lib/utils/html";

export function generateArticleMetadata(
  post: PostDetailFieldsFragment,
): Metadata {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/${post.slug}`;
  const description =
    post.articleFields?.subtitle ||
    (post.excerpt ? stripHtml(post.excerpt) : labels.site.fallbackDescription);
  const title = post.title;
  const featuredImage = post.featuredImage?.node;

  const images = featuredImage?.sourceUrl
    ? [
        {
          url: featuredImage.sourceUrl,
          width: featuredImage.mediaDetails?.width ?? 1200,
          height: featuredImage.mediaDetails?.height ?? 630,
          alt: featuredImage.altText || title || "",
        },
      ]
    : [];

  return {
    title: title ?? undefined,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      title: title ?? undefined,
      description,
      url,
      siteName: labels.site.name,
      publishedTime: post.date ?? undefined,
      modifiedTime: post.modified ?? undefined,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: title ?? undefined,
      description,
      images: featuredImage?.sourceUrl ? [featuredImage.sourceUrl] : [],
    },
  };
}
