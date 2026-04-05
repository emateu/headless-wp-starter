import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { Suspense } from "react";
import { ArchivePagination } from "~/components/archive-pagination";
import { ArticleCard } from "~/components/article-card";
import { SearchForm } from "~/components/layout/search-form";
import { labels } from "~/lib/config/labels";
import { getSiteUrl } from "~/lib/config/site";
import type {
  SearchPostsQuery,
  SearchPostsQueryVariables,
} from "~/lib/graphql/__generated__/graphql";
import { SearchPostsDocument } from "~/lib/graphql/__generated__/graphql";
import { graphqlClient } from "~/lib/graphql/client";
import { getCursorForPage, POSTS_PER_PAGE } from "~/lib/utils/pagination";

async function searchPosts(query: string, page: number) {
  "use cache";
  cacheLife("listing");

  try {
    const after = getCursorForPage(page);
    const data = await graphqlClient.request<
      SearchPostsQuery,
      SearchPostsQueryVariables
    >(SearchPostsDocument, {
      first: POSTS_PER_PAGE,
      after,
      search: query,
    });
    return {
      posts: data.posts?.nodes ?? [],
      hasNextPage: data.posts?.pageInfo.hasNextPage ?? false,
    };
  } catch {
    return { posts: [], hasNextPage: false };
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  const title = query
    ? `${labels.search.resultsFor.replace("{query}", query)} — ${labels.site.name}`
    : `${labels.search.title} — ${labels.site.name}`;
  const url = `${getSiteUrl()}/search${query ? `?q=${encodeURIComponent(query)}` : ""}`;

  return {
    title,
    alternates: { canonical: url },
    robots: { index: false },
  };
}

async function SearchResultsLoader({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim() || "";
  const page = Math.max(1, Number(pageParam) || 1);

  if (!query) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold md:text-4xl">
            {labels.search.title}
          </h1>
          <p className="mt-2 text-muted-foreground">{labels.search.noQuery}</p>
        </header>
        <div className="mx-auto max-w-md">
          <SearchForm />
        </div>
      </div>
    );
  }

  const { posts, hasNextPage } = await searchPosts(query, page);
  const basePath = `/search?q=${encodeURIComponent(query)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">
          {labels.search.resultsFor.replace("{query}", query)}
        </h1>
      </header>

      {posts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <ArticleCard key={post.databaseId} post={post} />
          ))}
        </div>
      ) : (
        <div>
          <p className="mb-6 text-muted-foreground">
            {labels.search.noResults.replace("{query}", query)}
          </p>
          <div className="mx-auto max-w-md">
            <SearchForm />
          </div>
        </div>
      )}

      <ArchivePagination
        currentPage={page}
        hasNextPage={hasNextPage}
        basePath={basePath}
      />
    </div>
  );
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl animate-pulse px-4 py-8">
          <div className="mb-8 h-10 w-64 rounded bg-muted" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-64 rounded bg-muted" />
            <div className="h-64 rounded bg-muted" />
            <div className="h-64 rounded bg-muted" />
            <div className="h-64 rounded bg-muted" />
            <div className="h-64 rounded bg-muted" />
            <div className="h-64 rounded bg-muted" />
          </div>
        </div>
      }
    >
      <SearchResultsLoader searchParams={searchParams} />
    </Suspense>
  );
}
