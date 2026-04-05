import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sampleSlices } from "~/__tests__/fixtures";
import type { SliceFieldsFragment } from "~/lib/graphql/__generated__/graphql";

// Mock each slice component to render a testable marker
vi.mock("~/components/slices/rich-text", () => ({
  RichText: () => <div data-testid="slice-rich-text" />,
}));
vi.mock("~/components/slices/image-slice", () => ({
  ImageSlice: () => <div data-testid="slice-image" />,
}));
vi.mock("~/components/slices/quote", () => ({
  Quote: () => <div data-testid="slice-quote" />,
}));
vi.mock("~/components/slices/infobox", () => ({
  Infobox: () => <div data-testid="slice-infobox" />,
}));
vi.mock("~/components/slices/gallery", () => ({
  Gallery: () => <div data-testid="slice-gallery" />,
}));
vi.mock("~/components/slices/embed", () => ({
  Embed: () => <div data-testid="slice-embed" />,
}));
vi.mock("~/components/slices/hero", () => ({
  Hero: () => <div data-testid="slice-hero" />,
}));
vi.mock("~/components/slices/latest-posts", () => ({
  LatestPosts: () => <div data-testid="slice-latest-posts" />,
}));
vi.mock("~/components/ad-slot", () => ({
  AdSlot: ({ slot }: { slot: string }) => <div data-testid={`ad-${slot}`} />,
}));

// Import after mocks are set up
const { SliceResolver } = await import("~/components/slices/slice-resolver");

afterEach(() => cleanup());

describe("SliceResolver", () => {
  it("renders the correct component for each slice type", () => {
    render(<SliceResolver slices={sampleSlices} />);

    expect(screen.getByTestId("slice-rich-text")).toBeInTheDocument();
    expect(screen.getByTestId("slice-quote")).toBeInTheDocument();
    expect(screen.getByTestId("slice-infobox")).toBeInTheDocument();
  });

  it("maps Page slice types to the same components", () => {
    const pageSlices: SliceFieldsFragment[] = [
      {
        __typename: "ContentSlicesContentSlicesRichTextLayout",
        fieldGroupName: "ContentSlicesContentSlicesRichTextLayout",
        content: "<p>Page content.</p>",
      },
      {
        __typename: "ContentSlicesContentSlicesGalleryLayout",
        fieldGroupName: "ContentSlicesContentSlicesGalleryLayout",
        images: null,
      },
    ];

    render(<SliceResolver slices={pageSlices} />);

    expect(screen.getByTestId("slice-rich-text")).toBeInTheDocument();
    expect(screen.getByTestId("slice-gallery")).toBeInTheDocument();
  });

  it("handles unknown slice types gracefully without crashing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const unknownSlices = [
      {
        __typename: "Post_Contentslices_ContentSlices_UnknownType",
        fieldGroupName: "Post_Contentslices_ContentSlices_UnknownType",
      },
    ] as unknown as SliceFieldsFragment[];

    const { container } = render(<SliceResolver slices={unknownSlices} />);

    // Should render nothing for unknown types
    expect(container.children).toHaveLength(0);

    warnSpy.mockRestore();
  });

  it("renders empty when given an empty slice array", () => {
    const { container } = render(<SliceResolver slices={[]} />);
    expect(container.children).toHaveLength(0);
  });

  it("inserts ad slot after configured slice when withAds is true", () => {
    // articleAdInsertAfterSlice is 3, so we need at least 3 slices
    render(<SliceResolver slices={sampleSlices} withAds />);

    expect(screen.getByTestId("ad-article-mid")).toBeInTheDocument();
  });

  it("does not insert ad slot when withAds is false", () => {
    render(<SliceResolver slices={sampleSlices} withAds={false} />);

    expect(screen.queryByTestId("ad-article-mid")).not.toBeInTheDocument();
  });
});
