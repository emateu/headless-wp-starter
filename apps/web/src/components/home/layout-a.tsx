import type { HomepageData } from "~/lib/graphql/queries/get-homepage-data";
import { AdSlot } from "../ad-slot";
import { BannerHighlight } from "./banner-highlight";
import { CategorySections } from "./category-sections";
import { HeroZone } from "./hero-zone";
import { PostGrid } from "./post-grid";

export function LayoutA({ data }: { data: HomepageData }) {
  return (
    <div className="space-y-8">
      <AdSlot slot="header-leaderboard" className="mx-auto" />

      {data.heroPost && (
        <HeroZone heroPost={data.heroPost} sidebarPosts={data.sidebarPosts} />
      )}

      {data.gridPosts.length > 0 && <PostGrid posts={data.gridPosts} />}

      {data.bannerPost && <BannerHighlight post={data.bannerPost} />}

      <AdSlot slot="between-sections" className="mx-auto" />

      <CategorySections
        categorySections={data.categorySections}
        trendingTags={data.trendingTags}
      />
    </div>
  );
}
