import Link from "next/link";
import type { PostCardFieldsFragment } from "~/lib/graphql/__generated__/graphql";
import { CategoryBadge } from "../category-badge";
import { OptimizedImage } from "../optimized-image";

interface HeroZoneProps {
  heroPost: PostCardFieldsFragment;
  sidebarPosts: PostCardFieldsFragment[];
}

export function HeroZone({ heroPost, sidebarPosts }: HeroZoneProps) {
  const heroCategory = heroPost.categories?.nodes[0];
  const heroImage = heroPost.featuredImage?.node;

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <Link
        href={`/${heroPost.slug}`}
        className="group relative col-span-full overflow-hidden rounded-lg lg:col-span-2"
      >
        {heroImage ? (
          <OptimizedImage
            src={heroImage.sourceUrl ?? ""}
            alt={heroImage.altText || heroPost.title || ""}
            variant="hero"
            priority
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="aspect-[3/2] bg-muted lg:aspect-[16/9]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {heroCategory && <CategoryBadge category={heroCategory} />}
          <h2 className="mt-2 text-2xl font-bold leading-tight text-white md:text-3xl lg:text-4xl">
            {heroPost.title}
          </h2>
          {heroPost.articleFields?.subtitle && (
            <p className="mt-2 line-clamp-2 text-base text-white/80 md:text-lg">
              {heroPost.articleFields.subtitle}
            </p>
          )}
        </div>
      </Link>

      <div className="col-span-full flex flex-col gap-4 lg:col-span-1">
        {sidebarPosts.map((post) => (
          <SidebarNote key={post.databaseId} post={post} />
        ))}
      </div>
    </section>
  );
}

function SidebarNote({ post }: { post: PostCardFieldsFragment }) {
  const category = post.categories?.nodes[0];
  const image = post.featuredImage?.node;

  return (
    <Link
      href={`/${post.slug}`}
      className="group flex flex-1 gap-4 overflow-hidden rounded-lg border bg-card p-3 transition-shadow hover:shadow-md lg:flex-col lg:p-0"
    >
      <div className="w-28 shrink-0 overflow-hidden rounded-md lg:w-full lg:rounded-b-none lg:rounded-t-lg">
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
      <div className="flex flex-col justify-center lg:p-4">
        {category && <CategoryBadge category={category} />}
        <h3 className="mt-1 font-bold leading-tight text-sm lg:text-base">
          {post.title}
        </h3>
      </div>
    </Link>
  );
}
