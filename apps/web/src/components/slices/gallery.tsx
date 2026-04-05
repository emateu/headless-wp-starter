import type { SliceFieldsFragment } from "~/lib/graphql/__generated__/graphql";
import { OptimizedImage } from "../optimized-image";

type GallerySlice = Extract<
  SliceFieldsFragment,
  { __typename?: "ContentSlicesContentSlicesGalleryLayout" }
>;

export function Gallery({ slice }: { slice: GallerySlice }) {
  const images = slice.images?.nodes;
  if (!images || images.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
      {images.map((image) => (
        <div key={image.databaseId} className="overflow-hidden rounded-lg">
          <OptimizedImage
            src={image.sourceUrl ?? ""}
            alt={image.altText || ""}
            variant="gallery"
            className="h-auto w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}
