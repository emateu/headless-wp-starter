import { cacheLife } from "next/cache";
import type {
  GetAllCategoriesQuery,
  GetAllTagsQuery,
  GetFeaturedPostQuery,
  GetHomepageSettingsQuery,
  GetLatestPostsQuery,
  GetLatestPostsQueryVariables,
  GetPostByIdQuery,
  GetPostByIdQueryVariables,
  GetPostsByCategoryIdQuery,
  GetPostsByCategoryIdQueryVariables,
} from "../__generated__/graphql";
import {
  GetAllCategoriesDocument,
  GetAllTagsDocument,
  GetFeaturedPostDocument,
  GetHomepageSettingsDocument,
  GetLatestPostsDocument,
  GetPostByIdDocument,
  GetPostsByCategoryIdDocument,
} from "../__generated__/graphql";
import { graphqlClient } from "../client";

function getNodeId(
  node: { __typename?: string; databaseId?: number } | null | undefined,
): number | undefined {
  if (node && "databaseId" in node) {
    return node.databaseId;
  }
  return undefined;
}

type Category = NonNullable<
  GetAllCategoriesQuery["categories"]
>["nodes"][number];
type Tag = NonNullable<GetAllTagsQuery["tags"]>["nodes"][number];
type PostCard = NonNullable<GetLatestPostsQuery["posts"]>["nodes"][number];

export interface HomepageData {
  layout: "layout_a" | "layout_c";
  heroPost: PostCard | null;
  sidebarPosts: PostCard[];
  gridPosts: PostCard[];
  bannerPost: PostCard | null;
  categorySections: { category: Category; posts: PostCard[] }[];
  trendingTags: Tag[];
}

export async function getHomepageData(): Promise<HomepageData> {
  "use cache";
  cacheLife("home");

  const empty: HomepageData = {
    layout: "layout_a",
    heroPost: null,
    sidebarPosts: [],
    gridPosts: [],
    bannerPost: null,
    categorySections: [],
    trendingTags: [],
  };

  try {
    // Phase 1: Fetch settings, categories, and tags in parallel
    const [settingsData, categoriesData, tagsData] = await Promise.all([
      graphqlClient.request<GetHomepageSettingsQuery>(
        GetHomepageSettingsDocument,
      ),
      graphqlClient.request<GetAllCategoriesQuery>(GetAllCategoriesDocument),
      graphqlClient.request<GetAllTagsQuery>(GetAllTagsDocument),
    ]);

    const settings = settingsData.homepage?.homepageSettings;
    const rawLayout = settings?.homepageLayout?.[0];
    const layout: "layout_a" | "layout_c" =
      rawLayout === "layout_c" ? "layout_c" : "layout_a";
    const categories = categoriesData.categories?.nodes ?? [];
    const trendingTags = tagsData.tags?.nodes ?? [];

    // Phase 2: Fetch hero post (override or featured)
    let heroPost: PostCard | null = null;
    const featuredOverrideId = getNodeId(
      settings?.homepageFeaturedOverride?.nodes[0],
    );
    if (featuredOverrideId) {
      const data = await graphqlClient.request<
        GetPostByIdQuery,
        GetPostByIdQueryVariables
      >(GetPostByIdDocument, { id: String(featuredOverrideId) });
      heroPost = data.post ?? null;
    }
    if (!heroPost) {
      const data = await graphqlClient.request<GetFeaturedPostQuery>(
        GetFeaturedPostDocument,
      );
      heroPost = data.posts?.nodes[0] ?? null;
    }

    // Track used post IDs to avoid duplicates
    const usedIds: number[] = [];
    if (heroPost) usedIds.push(heroPost.databaseId);

    // Phase 3: Fetch sidebar override posts or latest
    let sidebarPosts: PostCard[] = [];
    const sidebarOverrides = settings?.homepageHeroSidebarOverrides;
    if (sidebarOverrides && sidebarOverrides.length > 0) {
      const overrideFetches = sidebarOverrides
        .map((item) => getNodeId(item?.post?.nodes[0]))
        .filter((id): id is number => id != null)
        .map((id) =>
          graphqlClient.request<GetPostByIdQuery, GetPostByIdQueryVariables>(
            GetPostByIdDocument,
            { id: String(id) },
          ),
        );
      const results = await Promise.all(overrideFetches);
      sidebarPosts = results
        .map((r) => r.post)
        .filter((p): p is PostCard => p !== null);
    }
    if (sidebarPosts.length < 2) {
      const needed = 2 - sidebarPosts.length;
      const existingIds = [
        ...usedIds,
        ...sidebarPosts.map((p) => p.databaseId),
      ];
      const data = await graphqlClient.request<
        GetLatestPostsQuery,
        GetLatestPostsQueryVariables
      >(GetLatestPostsDocument, {
        first: needed,
        notIn: existingIds.map(String),
      });
      sidebarPosts = [...sidebarPosts, ...(data.posts?.nodes ?? [])];
    }
    for (const p of sidebarPosts) usedIds.push(p.databaseId);

    // Phase 4: Fetch grid posts (next 3 latest) and banner post in parallel
    let bannerPost: PostCard | null = null;

    const [gridData, bannerResult] = await Promise.all([
      graphqlClient.request<GetLatestPostsQuery, GetLatestPostsQueryVariables>(
        GetLatestPostsDocument,
        { first: 3, notIn: usedIds.map(String) },
      ),
      getNodeId(settings?.homepageBannerOverride?.nodes[0])
        ? graphqlClient.request<GetPostByIdQuery, GetPostByIdQueryVariables>(
            GetPostByIdDocument,
            {
              id: String(getNodeId(settings?.homepageBannerOverride?.nodes[0])),
            },
          )
        : Promise.resolve(null),
    ]);

    const gridPosts = gridData.posts?.nodes ?? [];
    for (const p of gridPosts) usedIds.push(p.databaseId);

    if (bannerResult) {
      bannerPost = bannerResult.post ?? null;
    }
    if (!bannerPost && gridPosts.length > 0) {
      // Use the next latest post after grid as banner
      const data = await graphqlClient.request<
        GetLatestPostsQuery,
        GetLatestPostsQueryVariables
      >(GetLatestPostsDocument, { first: 1, notIn: usedIds.map(String) });
      bannerPost = data.posts?.nodes[0] ?? null;
    }
    if (bannerPost) usedIds.push(bannerPost.databaseId);

    // Phase 5: Fetch category sections in parallel
    const topCategories = categories
      .filter((c) => (c.count ?? 0) > 0)
      .slice(0, 4);
    const categoryFetches = topCategories.map((cat) =>
      graphqlClient
        .request<GetPostsByCategoryIdQuery, GetPostsByCategoryIdQueryVariables>(
          GetPostsByCategoryIdDocument,
          {
            first: 3,
            categoryId: cat.databaseId,
            notIn: usedIds.map(String),
          },
        )
        .then((data) => ({
          category: cat,
          posts: data.posts?.nodes ?? [],
        })),
    );
    const categorySections = (await Promise.all(categoryFetches)).filter(
      (section) => section.posts.length > 0,
    );

    return {
      layout,
      heroPost,
      sidebarPosts,
      gridPosts,
      bannerPost,
      categorySections,
      trendingTags,
    };
  } catch (error) {
    console.error("[getHomepageData]", error);
    return empty;
  }
}
