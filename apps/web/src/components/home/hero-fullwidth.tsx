import Link from "next/link";
import type { PostCardFieldsFragment } from "~/lib/graphql/__generated__/graphql";
import { CategoryBadge } from "../category-badge";
import { OptimizedImage } from "../optimized-image";

export function HeroFullwidth({ post }: { post: PostCardFieldsFragment }) {
  const category = post.categories?.nodes[0];
  const image = post.featuredImage?.node;

  return (
    <Link
      href={`/${post.slug}`}
      className="group relative block w-full overflow-hidden rounded-lg"
    >
      {image ? (
        <OptimizedImage
          src={image.sourceUrl ?? ""}
          alt={image.altText || post.title || ""}
          variant="hero"
          priority
          className="aspect-[3/2] w-full object-cover transition-transform duration-300 group-hover:scale-105 md:aspect-[16/9]"
        />
      ) : (
        <div className="aspect-[3/2] bg-muted md:aspect-[16/9]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        {category && <CategoryBadge category={category} />}
        <h2 className="mt-2 text-2xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
          {post.title}
        </h2>
        {post.articleFields?.subtitle && (
          <p className="mt-3 line-clamp-2 max-w-3xl text-base text-white/80 md:text-lg lg:text-xl">
            {post.articleFields.subtitle}
          </p>
        )}
      </div>
    </Link>
  );
}
