import { cacheLife } from "next/cache";
import Link from "next/link";
import { ArticleCard } from "~/components/article-card";
import { labels } from "~/lib/config/labels";
import type {
  GetPostsByCategoryIdQuery,
  GetPostsByCategoryIdQueryVariables,
  SliceFieldsFragment,
} from "~/lib/graphql/__generated__/graphql";
import { GetPostsByCategoryIdDocument } from "~/lib/graphql/__generated__/graphql";
import { graphqlClient } from "~/lib/graphql/client";

type LatestPostsSlice = Extract<
  SliceFieldsFragment,
  { __typename?: "ContentSlicesContentSlicesLatestPostsLayout" }
>;

async function getLatestPosts(categoryId: number | null, count: number) {
  "use cache";
  cacheLife("listing");

  try {
    const variables: GetPostsByCategoryIdQueryVariables = { first: count };
    if (categoryId) {
      variables.categoryId = categoryId;
    }

    const data = await graphqlClient.request<
      GetPostsByCategoryIdQuery,
      GetPostsByCategoryIdQueryVariables
    >(GetPostsByCategoryIdDocument, variables);

    return data.posts?.nodes ?? [];
  } catch (error) {
    console.error("[getLatestPosts]", error);
    return [];
  }
}

export async function LatestPosts({ slice }: { slice: LatestPostsSlice }) {
  const count = slice.count ?? 4;
  const categoryId = slice.category?.nodes[0]?.databaseId ?? null;
  const firstNode = slice.category?.nodes[0];
  const categorySlug =
    firstNode?.__typename === "Category" ? firstNode.slug : null;
  const posts = await getLatestPosts(categoryId, count);

  if (posts.length === 0) return null;

  return (
    <section>
      {slice.title && (
        <div className="mb-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold">{slice.title}</h2>
            {categorySlug && (
              <Link
                href={`/category/${categorySlug}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {labels.home.seeAll}
              </Link>
            )}
          </div>
          {slice.subtitle && (
            <p className="mt-1 text-muted-foreground">{slice.subtitle}</p>
          )}
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <ArticleCard key={post.databaseId} post={post} />
        ))}
      </div>
    </section>
  );
}
