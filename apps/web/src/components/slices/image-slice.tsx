import type { SliceFieldsFragment } from "~/lib/graphql/__generated__/graphql";
import { OptimizedImage } from "../optimized-image";

type ImageSliceType = Extract<
  SliceFieldsFragment,
  { __typename?: "ContentSlicesContentSlicesImageLayout" }
>;

export function ImageSlice({ slice }: { slice: ImageSliceType }) {
  const image = slice.image?.node;
  if (!image) return null;

  return (
    <figure>
      <OptimizedImage
        src={image.sourceUrl ?? ""}
        alt={slice.altText || image.altText || ""}
        variant="articleBody"
        className="h-auto w-full rounded-lg object-cover"
      />
      {slice.caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {slice.caption}
        </figcaption>
      )}
    </figure>
  );
}
