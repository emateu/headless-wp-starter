import type { HomepageData } from "~/lib/graphql/queries/get-homepage-data";
import { SectionRow } from "./section-row";
import { Sidebar } from "./sidebar";

interface CategorySectionsProps {
  categorySections: HomepageData["categorySections"];
  trendingTags: HomepageData["trendingTags"];
}

export function CategorySections({
  categorySections,
  trendingTags,
}: CategorySectionsProps) {
  if (categorySections.length === 0) return null;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        {categorySections.map((section) => (
          <SectionRow
            key={section.category.databaseId}
            category={section.category}
            posts={section.posts}
          />
        ))}
      </div>
      <Sidebar trendingTags={trendingTags} />
    </div>
  );
}
