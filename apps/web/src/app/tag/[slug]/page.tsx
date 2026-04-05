import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArchiveLayout, ArchiveSkeleton } from "~/components/archive-layout";
import { labels } from "~/lib/config/labels";
import { getSiteUrl } from "~/lib/config/site";
import type {
  GetPostsByTagSlugQuery,
  GetPostsByTagSlugQueryVariables,
  GetTagDetailQuery,
  GetTagDetailQueryVariables,
} from "~/lib/graphql/__generated__/graphql";
import {
  GetPostsByTagSlugDocument,
  GetTagDetailDocument,
} from "~/lib/graphql/__generated__/graphql";
import { graphqlClient } from "~/lib/graphql/client";
import { getCursorForPage, POSTS_PER_PAGE } from "~/lib/utils/pagination";

async function getTagDetail(slug: string) {
  "use cache";
  cacheLife("listing");

  try {
    const data = await graphqlClient.request<
      GetTagDetailQuery,
      GetTagDetailQueryVariables
    >(GetTagDetailDocument, { slug: [slug] });
    return data.tags?.nodes[0] ?? null;
  } catch (error) {
    console.error("[getTagDetail]", error);
    return null;
  }
}

async function getTagPosts(slug: string, page: number) {
  "use cache";
  cacheLife("listing");

  try {
    const after = getCursorForPage(page);
    const data = await graphqlClient.request<
      GetPostsByTagSlugQuery,
      GetPostsByTagSlugQueryVariables
    >(GetPostsByTagSlugDocument, {
      first: POSTS_PER_PAGE,
      after,
      tagSlug: slug,
    });
    return {
      posts: data.posts?.nodes ?? [],
      hasNextPage: data.posts?.pageInfo.hasNextPage ?? false,
    };
  } catch (error) {
    console.error("[getTagPosts]", error);
    return { posts: [], hasNextPage: false };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagDetail(slug);
  if (!tag) return {};

  const title = labels.archive.tagTitle.replace("{tag}", tag.name ?? "");
  const description = labels.archive.tagDescription.replace(
    "{tag}",
    tag.name ?? "",
  );
  const url = `${getSiteUrl()}/tag/${tag.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
  };
}

async function TagArchiveLoader({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [tag, { posts, hasNextPage }] = await Promise.all([
    getTagDetail(slug),
    getTagPosts(slug, page),
  ]);

  if (!tag) notFound();

  return (
    <ArchiveLayout
      title={
        <>
          <span className="text-muted-foreground">#</span>
          {tag.name}
        </>
      }
      description={tag.description}
      posts={posts}
      currentPage={page}
      hasNextPage={hasNextPage}
      basePath={`/tag/${tag.slug}`}
    />
  );
}

export default function TagArchivePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <Suspense fallback={<ArchiveSkeleton />}>
      <TagArchiveLoader params={params} searchParams={searchParams} />
    </Suspense>
  );
}
