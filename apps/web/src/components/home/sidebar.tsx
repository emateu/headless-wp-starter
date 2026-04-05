import Link from "next/link";
import { labels } from "~/lib/config/labels";
import type { TagFieldsFragment } from "~/lib/graphql/__generated__/graphql";
import { AdSlot } from "../ad-slot";

export function Sidebar({
  trendingTags,
}: {
  trendingTags: TagFieldsFragment[];
}) {
  return (
    <aside className="space-y-6">
      <AdSlot slot="sidebar-top" />

      {trendingTags.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-bold">{labels.home.trendingTags}</h3>
          <div className="flex flex-wrap gap-2">
            {trendingTags.map((tag) => (
              <Link
                key={tag.databaseId}
                href={`/tag/${tag.slug}`}
                className="rounded-full border px-3 py-1 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">Newsletter</p>
      </div>

      <AdSlot slot="sidebar-bottom" />
    </aside>
  );
}
