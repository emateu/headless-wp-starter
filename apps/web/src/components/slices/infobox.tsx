import type { SliceFieldsFragment } from "~/lib/graphql/__generated__/graphql";

type InfoboxSlice = Extract<
  SliceFieldsFragment,
  { __typename?: "ContentSlicesContentSlicesInfoboxLayout" }
>;

export function Infobox({ slice }: { slice: InfoboxSlice }) {
  if (!slice.title && !slice.content) return null;

  return (
    <aside className="rounded-lg border border-border bg-muted/50 p-6">
      {slice.title && (
        <h3 className="mb-3 font-heading text-lg font-bold">{slice.title}</h3>
      )}
      {slice.content && (
        <div
          className="prose prose-sm max-w-none prose-headings:font-heading prose-a:text-primary"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: WordPress WYSIWYG is a trusted source
          dangerouslySetInnerHTML={{ __html: slice.content }}
        />
      )}
    </aside>
  );
}
