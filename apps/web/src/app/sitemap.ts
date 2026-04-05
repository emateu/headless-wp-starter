import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";
import { getSiteUrl } from "~/lib/config/site";
import type {
  GetAllCategoriesForSitemapQuery,
  GetAllPostsForSitemapQuery,
  GetAllPostsForSitemapQueryVariables,
} from "~/lib/graphql/__generated__/graphql";
import {
  GetAllCategoriesForSitemapDocument,
  GetAllPostsForSitemapDocument,
} from "~/lib/graphql/__generated__/graphql";
import { graphqlClient } from "~/lib/graphql/client";

async function getSitemapData() {
  "use cache";
  cacheLife("static");

  const [postsData, categoriesData] = await Promise.all([
    graphqlClient.request<
      GetAllPostsForSitemapQuery,
      GetAllPostsForSitemapQueryVariables
    >(GetAllPostsForSitemapDocument, { first: 1000 }),
    graphqlClient.request<GetAllCategoriesForSitemapQuery>(
      GetAllCategoriesForSitemapDocument,
    ),
  ]);

  return {
    posts: postsData.posts?.nodes ?? [],
    categories: categoriesData.categories?.nodes ?? [],
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  try {
    const { posts, categories } = await getSitemapData();

    const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${siteUrl}/${post.slug}`,
      lastModified: post.modified ?? undefined,
      changeFrequency: "daily",
      priority: 0.8,
    }));

    const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${siteUrl}/category/${cat.slug}`,
      changeFrequency: "daily",
      priority: 0.6,
    }));

    return [
      {
        url: siteUrl,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 1.0,
      },
      ...postEntries,
      ...categoryEntries,
    ];
  } catch (error) {
    console.error("[sitemap]", error);
    return [
      {
        url: siteUrl,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 1.0,
      },
    ];
  }
}
