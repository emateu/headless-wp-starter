import { labels } from "~/lib/config/labels";
import type { PostCardFieldsFragment } from "~/lib/graphql/__generated__/graphql";
import { ArchivePagination } from "./archive-pagination";
import { ArticleCard } from "./article-card";

interface ArchiveLayoutProps {
  title: React.ReactNode;
  description?: string | null;
  count?: number | null;
  posts: PostCardFieldsFragment[];
  currentPage: number;
  hasNextPage: boolean;
  basePath: string;
}

export function ArchiveLayout({
  title,
  description,
  count,
  posts,
  currentPage,
  hasNextPage,
  basePath,
}: ArchiveLayoutProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        {description && (
          <p className="mt-2 text-muted-foreground">{description}</p>
        )}
        {count != null && (
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.archive.postsCount.replace("{count}", String(count))}
          </p>
        )}
      </header>

      {posts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <ArticleCard key={post.databaseId} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">{labels.archive.noResults}</p>
      )}

      <ArchivePagination
        currentPage={currentPage}
        hasNextPage={hasNextPage}
        basePath={basePath}
      />
    </div>
  );
}

export function ArchiveSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8">
      <div className="mb-8 h-10 w-48 rounded bg-muted" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-64 rounded bg-muted" />
        <div className="h-64 rounded bg-muted" />
        <div className="h-64 rounded bg-muted" />
        <div className="h-64 rounded bg-muted" />
        <div className="h-64 rounded bg-muted" />
        <div className="h-64 rounded bg-muted" />
      </div>
    </div>
  );
}
