import Link from "next/link";
import { labels } from "~/lib/config/labels";
import type {
  CategoryFieldsFragment,
  PostCardFieldsFragment,
} from "~/lib/graphql/__generated__/graphql";
import { ArticleCard } from "../article-card";

interface SectionRowProps {
  category: CategoryFieldsFragment;
  posts: PostCardFieldsFragment[];
}

export function SectionRow({ category, posts }: SectionRowProps) {
  if (posts.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between border-b-2 border-primary pb-2">
        <h2 className="text-xl font-bold">{category.name}</h2>
        <Link
          href={`/category/${category.slug}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          {labels.home.seeAll}
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <ArticleCard key={post.databaseId} post={post} />
        ))}
      </div>
    </section>
  );
}
