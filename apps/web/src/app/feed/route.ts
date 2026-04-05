import { labels } from "~/lib/config/labels";
import { getSiteUrl } from "~/lib/config/site";
import type {
  GetPostsForFeedQuery,
  GetPostsForFeedQueryVariables,
} from "~/lib/graphql/__generated__/graphql";
import { GetPostsForFeedDocument } from "~/lib/graphql/__generated__/graphql";
import { graphqlClient } from "~/lib/graphql/client";
import { buildRssFeed } from "~/lib/utils/rss";

export async function GET() {
  const siteUrl = getSiteUrl();

  try {
    const data = await graphqlClient.request<
      GetPostsForFeedQuery,
      GetPostsForFeedQueryVariables
    >(GetPostsForFeedDocument, { first: 50 });

    const posts = data.posts?.nodes ?? [];

    const xml = buildRssFeed({
      title: labels.feed.title,
      description: labels.feed.description,
      siteUrl,
      feedUrl: `${siteUrl}/feed`,
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
