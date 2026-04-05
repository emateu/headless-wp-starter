import { AdSlot } from "~/components/ad-slot";
import { articleAdInsertAfterSlice } from "~/lib/config/ad-slots";
import type { SliceFieldsFragment } from "~/lib/graphql/__generated__/graphql";
import { Embed } from "./embed";
import { Gallery } from "./gallery";
import { Hero } from "./hero";
import { ImageSlice } from "./image-slice";
import { Infobox } from "./infobox";
import { LatestPosts } from "./latest-posts";
import { Quote } from "./quote";
import { RichText } from "./rich-text";

function renderSlice(slice: SliceFieldsFragment) {
  switch (slice.__typename) {
    case "ContentSlicesContentSlicesRichTextLayout":
      return <RichText slice={slice} />;
    case "ContentSlicesContentSlicesImageLayout":
      return <ImageSlice slice={slice} />;
    case "ContentSlicesContentSlicesQuoteLayout":
      return <Quote slice={slice} />;
    case "ContentSlicesContentSlicesInfoboxLayout":
      return <Infobox slice={slice} />;
    case "ContentSlicesContentSlicesGalleryLayout":
      return <Gallery slice={slice} />;
    case "ContentSlicesContentSlicesEmbedLayout":
      return <Embed slice={slice} />;
    case "ContentSlicesContentSlicesHeroLayout":
      return <Hero slice={slice} />;
    case "ContentSlicesContentSlicesLatestPostsLayout":
      return <LatestPosts slice={slice} />;
    default:
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `SliceResolver: no component for "${(slice as { __typename?: string }).__typename}"`,
        );
      }
      return null;
  }
}

interface SliceResolverProps {
  slices: SliceFieldsFragment[];
  withAds?: boolean;
}

export function SliceResolver({ slices, withAds = false }: SliceResolverProps) {
  return (
    <>
      {slices.map((slice, index) => {
        const content = renderSlice(slice);
        if (!content) return null;

        const sliceNumber = index + 1;
        const showAd = withAds && sliceNumber === articleAdInsertAfterSlice;

        return (
          <div key={`slice-${index}-${slice.__typename}`}>
            {content}
            {showAd && <AdSlot slot="article-mid" className="my-8" />}
          </div>
        );
      })}
    </>
  );
}
