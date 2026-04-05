import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArticleLayout } from "~/components/article-layout";
import { SliceResolver } from "~/components/slices/slice-resolver";
import { imageSizes } from "~/lib/config/image-sizes";
import { labels } from "~/lib/config/labels";
import { getSiteUrl } from "~/lib/config/site";
import type {
  GetPageByUriQuery,
  GetPageByUriQueryVariables,
  GetPostBySlugQuery,
  GetPostBySlugQueryVariables,
} from "~/lib/graphql/__generated__/graphql";
import {
  GetPageByUriDocument,
  GetPostBySlugDocument,
} from "~/lib/graphql/__generated__/graphql";
import { graphqlClient } from "~/lib/graphql/client";
import { jsonLdArticle } from "~/lib/seo/json-ld";
import { generateArticleMetadata } from "~/lib/seo/metadata";

type PageDetail = NonNullable<GetPageByUriQuery["pageBy"]>;

function slugToUri(segments: string[]): string {
  return `/${segments.join("/")}`;
}

async function getPost(slug: string) {
  "use cache";
  cacheLife("article");

  try {
    const data = await graphqlClient.request<
      GetPostBySlugQuery,
      GetPostBySlugQueryVariables
    >(GetPostBySlugDocument, { slug });
    return data.postBy;
  } catch (error) {
    console.error("[getPost]", error);
    return null;
  }
}

async function getPage(uri: string) {
  "use cache";
  cacheLife("static");

  try {
    const data = await graphqlClient.request<
      GetPageByUriQuery,
      GetPageByUriQueryVariables
    >(GetPageByUriDocument, { uri });
    return data.pageBy;
  } catch (error) {
    console.error("[getPage]", error);
    return null;
  }
}

/**
 * Resolve content: single-segment slugs try post first then page;
 * multi-segment slugs go straight to page.
 */
async function resolveContent(segments: string[]) {
  const uri = slugToUri(segments);

  if (segments.length === 1) {
    const post = await getPost(segments[0]);
    if (post) return { type: "post" as const, post };
  }

  const page = await getPage(uri);
  if (page) return { type: "page" as const, page };

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const content = await resolveContent(slug);
  if (!content) return {};

  if (content.type === "post") {
    return generateArticleMetadata(content.post);
  }

  const page = content.page;
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${slugToUri(slug)}`;
  const featuredImage = page.featuredImage?.node;
  const description = labels.site.fallbackDescription;

  const images = featuredImage?.sourceUrl
    ? [
        {
          url: featuredImage.sourceUrl,
          width: featuredImage.mediaDetails?.width ?? 1200,
          height: featuredImage.mediaDetails?.height ?? 630,
          alt: featuredImage.altText || page.title || "",
        },
      ]
    : [];

  return {
    title: page.title ?? undefined,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: page.title ?? undefined,
      description,
      url,
      siteName: labels.site.name,
      images,
    },
    twitter: {
      card: featuredImage ? "summary_large_image" : "summary",
      title: page.title ?? undefined,
      description,
      images: featuredImage?.sourceUrl ? [featuredImage.sourceUrl] : [],
    },
  };
}

function PageView({ page }: { page: PageDetail }) {
  const featuredImage = page.featuredImage?.node;
  const slices = (page.contentSlices?.contentSlices ?? []).flatMap((s) =>
    s ? [s] : [],
  );

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
          {page.title}
        </h1>
      </header>

      {featuredImage && (
        <div className="relative mb-8 overflow-hidden rounded-lg">
          <Image
            src={featuredImage.sourceUrl ?? ""}
            alt={featuredImage.altText || page.title || ""}
            width={imageSizes.articleBody.desktop.width}
            height={imageSizes.articleBody.desktop.height}
            sizes={imageSizes.articleBody.sizes}
            className="h-auto w-full object-cover"
          />
        </div>
      )}

      <div className="space-y-8">
        <SliceResolver slices={slices} />
      </div>
    </article>
  );
}

async function ContentLoader({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const content = await resolveContent(slug);

  if (!content) notFound();

  if (content.type === "post") {
    return (
      <ArticleLayout post={content.post} jsonLd={jsonLdArticle(content.post)} />
    );
  }

  return <PageView page={content.page} />;
}

export default function ContentPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl animate-pulse px-4 py-8">
          <div className="mb-4 h-12 w-3/4 rounded bg-muted" />
          <div className="h-64 rounded bg-muted" />
        </div>
      }
    >
      <ContentLoader params={params} />
    </Suspense>
  );
}
