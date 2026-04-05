import { format } from "date-fns";
import Link from "next/link";
import type { PostCardFieldsFragment } from "~/lib/graphql/__generated__/graphql";
import { CategoryBadge } from "./category-badge";
import { OptimizedImage } from "./optimized-image";

export function ArticleCard({ post }: { post: PostCardFieldsFragment }) {
  const category = post.categories?.nodes[0];
  const featuredImage = post.featuredImage?.node;

  return (
    <Link
      href={`/${post.slug}`}
      className="group block overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
    >
      <div className="overflow-hidden">
        {featuredImage ? (
          <OptimizedImage
            src={featuredImage.sourceUrl ?? ""}
            alt={featuredImage.altText || post.title || ""}
            variant="card"
            className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="aspect-[16/9] bg-muted" />
        )}
      </div>
      <div className="p-4">
        {category && <CategoryBadge category={category} />}
        <h3 className="mt-2 text-base font-bold leading-tight">{post.title}</h3>
        {post.articleFields?.subtitle && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {post.articleFields.subtitle}
          </p>
        )}
        <time
          dateTime={post.date ?? undefined}
          className="mt-2 block text-xs text-muted-foreground"
        >
          {post.date && format(new Date(post.date), "MMMM d, yyyy")}
        </time>
      </div>
    </Link>
  );
}
