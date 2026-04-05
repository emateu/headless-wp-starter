import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArchiveLayout, ArchiveSkeleton } from "~/components/archive-layout";
import { labels } from "~/lib/config/labels";
import { getSiteUrl } from "~/lib/config/site";
import type {
  GetCategoryDetailQuery,
  GetCategoryDetailQueryVariables,
  GetPostsByCategorySlugQuery,
  GetPostsByCategorySlugQueryVariables,
} from "~/lib/graphql/__generated__/graphql";
import {
  GetCategoryDetailDocument,
  GetPostsByCategorySlugDocument,
} from "~/lib/graphql/__generated__/graphql";
import { graphqlClient } from "~/lib/graphql/client";
import { getCursorForPage, POSTS_PER_PAGE } from "~/lib/utils/pagination";

async function getCategoryDetail(slug: string) {
  "use cache";
  cacheLife("listing");

  try {
    const data = await graphqlClient.request<
      GetCategoryDetailQuery,
      GetCategoryDetailQueryVariables
    >(GetCategoryDetailDocument, { slug: [slug] });
    return data.categories?.nodes[0] ?? null;
  } catch (error) {
    console.error("[getCategoryDetail]", error);
    return null;
  }
}

async function getCategoryPosts(slug: string, page: number) {
  "use cache";
  cacheLife("listing");

  try {
    const after = getCursorForPage(page);
    const data = await graphqlClient.request<
      GetPostsByCategorySlugQuery,
      GetPostsByCategorySlugQueryVariables
    >(GetPostsByCategorySlugDocument, {
      first: POSTS_PER_PAGE,
      after,
      categorySlug: slug,
    });
    return {
      posts: data.posts?.nodes ?? [],
      hasNextPage: data.posts?.pageInfo.hasNextPage ?? false,
    };
  } catch (error) {
    console.error("[getCategoryPosts]", error);
    return { posts: [], hasNextPage: false };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryDetail(slug);
  if (!category) return {};

  const title = labels.archive.categoryTitle.replace(
    "{category}",
    category.name ?? "",
  );
  const description = labels.archive.categoryDescription.replace(
    "{category}",
    category.name ?? "",
  );
  const url = `${getSiteUrl()}/category/${category.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
  };
}

async function CategoryArchiveLoader({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [category, { posts, hasNextPage }] = await Promise.all([
    getCategoryDetail(slug),
    getCategoryPosts(slug, page),
  ]);

  if (!category) notFound();

  return (
    <ArchiveLayout
      title={category.name}
      description={category.description}
      count={category.count}
      posts={posts}
      currentPage={page}
      hasNextPage={hasNextPage}
      basePath={`/category/${category.slug}`}
    />
  );
}

export default function CategoryArchivePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <Suspense fallback={<ArchiveSkeleton />}>
      <CategoryArchiveLoader params={params} searchParams={searchParams} />
    </Suspense>
  );
}
