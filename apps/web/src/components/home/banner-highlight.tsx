import Link from "next/link";
import type { PostCardFieldsFragment } from "~/lib/graphql/__generated__/graphql";
import { CategoryBadge } from "../category-badge";
import { OptimizedImage } from "../optimized-image";

export function BannerHighlight({ post }: { post: PostCardFieldsFragment }) {
  const category = post.categories?.nodes[0];
  const image = post.featuredImage?.node;

  return (
    <Link
      href={`/${post.slug}`}
      className="group relative block overflow-hidden rounded-lg bg-muted"
    >
      <div className="grid items-center md:grid-cols-2">
        <div className="overflow-hidden">
          {image ? (
            <OptimizedImage
              src={image.sourceUrl ?? ""}
              alt={image.altText || post.title || ""}
              variant="card"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="aspect-[16/9] bg-muted" />
          )}
        </div>
        <div className="p-6 md:p-8">
          {category && <CategoryBadge category={category} />}
          <h3 className="mt-2 text-xl font-bold leading-tight md:text-2xl">
            {post.title}
          </h3>
          {post.articleFields?.subtitle && (
            <p className="mt-2 line-clamp-2 text-muted-foreground">
              {post.articleFields.subtitle}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
