import { format } from "date-fns";
import Image from "next/image";
import { AdSlot } from "~/components/ad-slot";
import { CategoryBadge } from "~/components/category-badge";
import { ShareButtons } from "~/components/share-buttons";
import { SliceResolver } from "~/components/slices/slice-resolver";
import { imageSizes } from "~/lib/config/image-sizes";
import { labels } from "~/lib/config/labels";
import { getSiteUrl } from "~/lib/config/site";
import type { GetPostBySlugQuery } from "~/lib/graphql/__generated__/graphql";

type PostDetail = NonNullable<GetPostBySlugQuery["postBy"]>;

interface ArticleLayoutProps {
  post: PostDetail;
  jsonLd?: object;
}

export function ArticleLayout({ post, jsonLd }: ArticleLayoutProps) {
  const category = post.categories?.nodes[0];
  const featuredImage = post.featuredImage?.node;
  const slices = (post.contentSlices?.contentSlices ?? []).flatMap((s) =>
    s ? [s] : [],
  );
  const articleUrl = `${getSiteUrl()}/${post.slug}`;

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      {jsonLd && (
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <header className="mb-8 space-y-4">
        {category && <CategoryBadge category={category} />}

        <h1 className="font-heading text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
          {post.title}
        </h1>

        {post.articleFields?.subtitle && (
          <p className="text-lg text-muted-foreground md:text-xl">
            {post.articleFields.subtitle}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <time
            dateTime={post.date ?? undefined}
            className="text-sm text-muted-foreground"
          >
            {labels.article.publishedOn}{" "}
            {post.date && format(new Date(post.date), "MMMM d, yyyy")}
          </time>
          <ShareButtons url={articleUrl} title={post.title ?? ""} />
        </div>
      </header>

      {featuredImage && (
        <div className="relative mb-8 overflow-hidden rounded-lg">
          <Image
            src={featuredImage.sourceUrl ?? ""}
            alt={featuredImage.altText || post.title || ""}
            width={imageSizes.articleBody.desktop.width}
            height={imageSizes.articleBody.desktop.height}
            sizes={imageSizes.articleBody.sizes}
            className="h-auto w-full object-cover"
            priority
          />
        </div>
      )}

      <div className="space-y-8">
        <SliceResolver slices={slices} withAds />
      </div>

      <AdSlot slot="article-bottom" className="my-8" />

      <footer className="mt-8 border-t pt-6">
        <ShareButtons url={articleUrl} title={post.title ?? ""} />
      </footer>
    </article>
  );
}
