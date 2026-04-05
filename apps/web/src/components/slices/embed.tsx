import Script from "next/script";
import type { SliceFieldsFragment } from "~/lib/graphql/__generated__/graphql";
import {
  detectEmbed,
  getTweetId,
  normalizeTwitterUrl,
} from "~/lib/utils/embed-provider";

type EmbedSlice = Extract<
  SliceFieldsFragment,
  { __typename?: "ContentSlicesContentSlicesEmbedLayout" }
>;

function YouTubeEmbed({ embedUrl }: { embedUrl: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
      <iframe
        src={embedUrl}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}

function InstagramEmbed({ embedUrl }: { embedUrl: string }) {
  return (
    <div className="mx-auto max-w-lg">
      <iframe
        src={embedUrl}
        title="Instagram post"
        allowFullScreen
        scrolling="no"
        loading="lazy"
        className="w-full rounded-lg border-0"
        style={{ minHeight: 500 }}
      />
    </div>
  );
}

function TwitterEmbed({ url }: { url: string }) {
  const tweetId = getTweetId(url);
  const canonicalUrl = normalizeTwitterUrl(url);

  return (
    <div className="mx-auto max-w-lg">
      <blockquote className="twitter-tweet" data-dnt="true">
        <a href={canonicalUrl}>View tweet {tweetId}</a>
      </blockquote>
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="afterInteractive"
      />
    </div>
  );
}

function FallbackLink({ url }: { url: string }) {
  return (
    <div className="rounded-lg border border-dashed border-muted-foreground/40 p-4">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
      >
        {url}
      </a>
    </div>
  );
}

export function Embed({ slice }: { slice: EmbedSlice }) {
  if (!slice.url) return null;

  const { provider, embedUrl } = detectEmbed(slice.url);

  if (provider === "youtube" && embedUrl) {
    return <YouTubeEmbed embedUrl={embedUrl} />;
  }
  if (provider === "instagram" && embedUrl) {
    return <InstagramEmbed embedUrl={embedUrl} />;
  }
  if (provider === "twitter") {
    return <TwitterEmbed url={slice.url} />;
  }
  return <FallbackLink url={slice.url} />;
}
