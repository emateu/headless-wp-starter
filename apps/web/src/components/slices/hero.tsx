import Link from "next/link";
import type { SliceFieldsFragment } from "~/lib/graphql/__generated__/graphql";
import { cn } from "~/lib/utils";
import { OptimizedImage } from "../optimized-image";

type HeroSlice = Extract<
  SliceFieldsFragment,
  { __typename?: "ContentSlicesContentSlicesHeroLayout" }
>;

export function Hero({ slice }: { slice: HeroSlice }) {
  if (!slice.title) return null;

  return (
    <section className="relative overflow-hidden rounded-xl aspect-[3/2] md:aspect-[16/9]">
      {slice.image?.node && (
        <OptimizedImage
          src={slice.image.node.sourceUrl ?? ""}
          alt={slice.image.node.altText || slice.title}
          variant="hero"
          priority
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
      <div
        className={cn(
          "relative flex h-full flex-col justify-end px-6 py-8 md:px-10 md:py-12",
          slice.image?.node ? "text-white" : "bg-muted",
        )}
      >
        <h2 className="max-w-3xl font-heading text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
          {slice.title}
        </h2>
        {slice.subtitle && (
          <p className="mt-3 max-w-2xl text-lg opacity-90 md:text-xl">
            {slice.subtitle}
          </p>
        )}
        {slice.ctaText && slice.ctaUrl && (
          <div className="mt-6">
            <Link
              href={slice.ctaUrl}
              className="inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {slice.ctaText}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
