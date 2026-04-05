import type { SliceFieldsFragment } from "~/lib/graphql/__generated__/graphql";

type RichTextSlice = Extract<
  SliceFieldsFragment,
  { __typename?: "ContentSlicesContentSlicesRichTextLayout" }
>;

export function RichText({ slice }: { slice: RichTextSlice }) {
  if (!slice.content) return null;

  return (
    <div
      className="prose prose-lg max-w-none prose-headings:font-heading prose-a:text-primary prose-img:rounded-lg"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: WordPress WYSIWYG is a trusted source
      dangerouslySetInnerHTML={{ __html: slice.content }}
    />
  );
}
