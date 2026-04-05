import { labels } from "~/lib/config/labels";
import { getSiteUrl } from "~/lib/config/site";
import type { PostDetailFieldsFragment } from "~/lib/graphql/__generated__/graphql";
import { stripHtml } from "~/lib/utils/html";

export interface NewsArticleJsonLd {
  "@context": "https://schema.org";
  "@type": "NewsArticle";
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  image?: string[];
  author: { "@type": "Organization"; name: string };
  publisher: {
    "@type": "Organization";
    name: string;
    logo?: { "@type": "ImageObject"; url: string };
  };
}

export function jsonLdArticle(
  post: PostDetailFieldsFragment,
): NewsArticleJsonLd {
  const siteUrl = getSiteUrl();
  const description =
    post.articleFields?.subtitle ||
    (post.excerpt ? stripHtml(post.excerpt) : "");

  const images = post.featuredImage?.node?.sourceUrl
    ? [post.featuredImage.node.sourceUrl]
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title ?? "",
    description,
    url: `${siteUrl}/${post.slug}`,
    datePublished: post.date ?? "",
    dateModified: post.modified ?? "",
    ...(images && { image: images }),
    author: {
      "@type": "Organization",
      name: labels.site.name,
    },
    publisher: {
      "@type": "Organization",
      name: labels.site.name,
    },
  };
}
