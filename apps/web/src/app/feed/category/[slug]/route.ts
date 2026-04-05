import { labels } from "~/lib/config/labels";
import { getSiteUrl } from "~/lib/config/site";
import type {
  GetCategoryBySlugQuery,
  GetCategoryBySlugQueryVariables,
  GetPostsForFeedByCategoryQuery,
  GetPostsForFeedByCategoryQueryVariables,
} from "~/lib/graphql/__generated__/graphql";
import {
  GetCategoryBySlugDocument,
  GetPostsForFeedByCategoryDocument,
} from "~/lib/graphql/__generated__/graphql";
import { graphqlClient } from "~/lib/graphql/client";
import { buildRssFeed } from "~/lib/utils/rss";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const siteUrl = getSiteUrl();

  try {
    const [categoryData, postsData] = await Promise.all([
      graphqlClient.request<
        GetCategoryBySlugQuery,
        GetCategoryBySlugQueryVariables
      >(GetCategoryBySlugDocument, { slug: [slug] }),
      graphqlClient.request<
        GetPostsForFeedByCategoryQuery,
        GetPostsForFeedByCategoryQueryVariables
      >(GetPostsForFeedByCategoryDocument, {
        first: 50,
        categorySlug: slug,
      }),
    ]);

    const category = categoryData.categories?.nodes?.[0];
    if (!category) {
      return new Response("Category not found", { status: 404 });
    }

    const posts = postsData.posts?.nodes ?? [];
    const categoryName = category.name ?? "";

    const xml = buildRssFeed({
      title: labels.feed.categoryFeedTitle.replace("{category}", categoryName),
      description: labels.feed.categoryFeedDescription.replace(
        "{category}",
        categoryName,
      ),
      siteUrl,
      feedUrl: `${siteUrl}/feed/category/${slug}`,
      posts,
    });

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch {
    return new Response("Feed temporarily unavailable", { status: 503 });
  }
}
