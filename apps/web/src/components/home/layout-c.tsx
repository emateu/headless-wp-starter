import type { HomepageData } from "~/lib/graphql/queries/get-homepage-data";
import { AdSlot } from "../ad-slot";
import { BannerHighlight } from "./banner-highlight";
import { CategorySections } from "./category-sections";
import { HeroFullwidth } from "./hero-fullwidth";
import { PostGrid } from "./post-grid";

export function LayoutC({ data }: { data: HomepageData }) {
  const allGridPosts = [...data.sidebarPosts, ...data.gridPosts];

  return (
    <div className="space-y-8">
      <AdSlot slot="header-leaderboard" className="mx-auto" />

      {data.heroPost && <HeroFullwidth post={data.heroPost} />}

      {allGridPosts.length > 0 && (
        <PostGrid posts={allGridPosts.slice(0, 4)} columns={4} />
      )}

      {data.bannerPost && <BannerHighlight post={data.bannerPost} />}

      <AdSlot slot="between-sections" className="mx-auto" />

      <CategorySections
        categorySections={data.categorySections}
        trendingTags={data.trendingTags}
      />
    </div>
  );
}
