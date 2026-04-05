import type { PostCardFieldsFragment } from "~/lib/graphql/__generated__/graphql";
import { cn } from "~/lib/utils";
import { ArticleCard } from "../article-card";

interface PostGridProps {
  posts: PostCardFieldsFragment[];
  columns?: 3 | 4;
}

export function PostGrid({ posts, columns = 3 }: PostGridProps) {
  if (posts.length === 0) return null;

  return (
    <div
      className={cn(
        "grid gap-6 sm:grid-cols-2",
        columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
      )}
    >
      {posts.map((post) => (
        <ArticleCard key={post.databaseId} post={post} />
      ))}
    </div>
  );
}
