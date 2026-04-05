import { labels } from "~/lib/config/labels";

export function PreviewBanner({ slug }: { slug?: string }) {
  const exitUrl = slug
    ? `/api/exit-preview?slug=${encodeURIComponent(slug)}`
    : "/api/exit-preview";

  return (
    <div className="sticky top-0 z-50 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
      {labels.preview.banner}
      {" — "}
      <a href={exitUrl} className="underline hover:no-underline">
        {labels.preview.exit}
      </a>
    </div>
  );
}
