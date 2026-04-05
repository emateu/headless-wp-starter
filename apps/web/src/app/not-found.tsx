import { cacheLife } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import { ArticleCard } from "~/components/article-card";
import { SearchForm } from "~/components/layout/search-form";
import { labels } from "~/lib/config/labels";
import type {
  GetLatestPostsQuery,
  GetLatestPostsQueryVariables,
} from "~/lib/graphql/__generated__/graphql";
import { GetLatestPostsDocument } from "~/lib/graphql/__generated__/graphql";
import { graphqlClient } from "~/lib/graphql/client";

async function getRecentPosts() {
  "use cache";
  cacheLife("listing");

  try {
    const data = await graphqlClient.request<
      GetLatestPostsQuery,
      GetLatestPostsQueryVariables
    >(GetLatestPostsDocument, { first: 3 });
    return data.posts?.nodes ?? [];
  } catch (error) {
    console.error("[getRecentPosts]", error);
    return [];
  }
}

async function RecentArticles() {
  const recentPosts = await getRecentPosts();

  if (recentPosts.length === 0) return null;

  return (
    <div className="mt-12 text-left">
      <h2 className="mb-6 text-xl font-bold">{labels.errors.recentArticles}</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recentPosts.map((post) => (
          <ArticleCard key={post.databaseId} post={post} />
        ))}
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-4xl font-bold">{labels.errors.notFound}</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        {labels.errors.notFoundDescription}
      </p>
      <p className="mt-6 text-muted-foreground">
        {labels.errors.searchSuggestion}
      </p>
      <div className="mt-4 flex justify-center">
        <SearchForm />
      </div>
      <div className="mt-4">
        <Link href="/" className="text-primary hover:underline">
          {labels.errors.goHome}
        </Link>
      </div>
      <Suspense>
        <RecentArticles />
      </Suspense>
    </div>
  );
}
