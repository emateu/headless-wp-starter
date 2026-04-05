import type { SliceFieldsFragment } from "~/lib/graphql/__generated__/graphql";

type QuoteSlice = Extract<
  SliceFieldsFragment,
  { __typename?: "ContentSlicesContentSlicesQuoteLayout" }
>;

export function Quote({ slice }: { slice: QuoteSlice }) {
  if (!slice.text) return null;

  return (
    <blockquote className="border-l-4 border-primary pl-6 italic">
      <p className="text-lg leading-relaxed text-foreground">{slice.text}</p>
      {slice.author && (
        <footer className="mt-3 text-sm font-medium text-muted-foreground">
          — {slice.author}
        </footer>
      )}
    </blockquote>
  );
}
