import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { samplePostCard, samplePostCardMinimal } from "~/__tests__/fixtures";

// Mock next/link to render a plain anchor
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock OptimizedImage to render a simple img
vi.mock("~/components/optimized-image", () => ({
  OptimizedImage: ({
    src,
    alt,
    variant,
  }: {
    src: string;
    alt: string;
    variant: string;
    // biome-ignore lint/performance/noImgElement: test mock does not need next/image
  }) => <img src={src} alt={alt} data-variant={variant} />,
}));

// Mock CategoryBadge to render a simple span
vi.mock("~/components/category-badge", () => ({
  CategoryBadge: ({ category }: { category: { name: string } }) => (
    <span data-testid="category-badge">{category.name}</span>
  ),
}));

const { ArticleCard } = await import("~/components/article-card");

afterEach(() => cleanup());

describe("ArticleCard", () => {
  it("renders title, subtitle, category, and formatted date", () => {
    render(<ArticleCard post={samplePostCard} />);

    expect(screen.getByText(samplePostCard.title!)).toBeInTheDocument();
    expect(
      screen.getByText(samplePostCard.articleFields?.subtitle as string),
    ).toBeInTheDocument();
    expect(screen.getByTestId("category-badge")).toHaveTextContent("Politics");
    expect(screen.getByText("March 15, 2026")).toBeInTheDocument();
  });

  it("renders featured image with card variant", () => {
    render(<ArticleCard post={samplePostCard} />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute(
      "src",
      samplePostCard.featuredImage?.node.sourceUrl,
    );
    expect(img).toHaveAttribute("data-variant", "card");
  });

  it("links to the article slug", () => {
    render(<ArticleCard post={samplePostCard} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", `/${samplePostCard.slug}`);
  });

  it("applies default padding styling", () => {
    const { container } = render(<ArticleCard post={samplePostCard} />);

    const padding = container.querySelector(".p-4");
    expect(padding).toBeInTheDocument();
  });

  it("renders without errors when optional fields are missing", () => {
    render(<ArticleCard post={samplePostCardMinimal} />);

    expect(screen.getByText(samplePostCardMinimal.title!)).toBeInTheDocument();
    // No image rendered
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    // No category badge
    expect(screen.queryByTestId("category-badge")).not.toBeInTheDocument();
    // No subtitle paragraph (only the h3 title should exist, no <p> subtitle)
    const paragraphs = screen.queryAllByText(/.+/, { selector: "p" });
    expect(paragraphs).toHaveLength(0);
  });
});
