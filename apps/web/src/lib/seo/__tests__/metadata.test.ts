import { describe, expect, it, vi } from "vitest";
import { samplePostDetail } from "~/__tests__/fixtures";
import type { PostDetailFieldsFragment } from "~/lib/graphql/__generated__/graphql";

vi.stubEnv("SITE_URL", "https://portal.example.com");

const { generateArticleMetadata } = await import("~/lib/seo/metadata");

describe("generateArticleMetadata", () => {
  it("returns correct title and description from subtitle", () => {
    const metadata = generateArticleMetadata(samplePostDetail);

    expect(metadata.title).toBe(samplePostDetail.title);
    expect(metadata.description).toBe(samplePostDetail.articleFields?.subtitle);
  });

  it("returns canonical URL based on slug", () => {
    const metadata = generateArticleMetadata(samplePostDetail);

    expect(metadata.alternates?.canonical).toBe(
      `https://portal.example.com/${samplePostDetail.slug}`,
    );
  });

  it("returns Open Graph metadata with article type", () => {
    const metadata = generateArticleMetadata(samplePostDetail);
    const og = metadata.openGraph;

    expect(og).toBeDefined();
    expect(og).toMatchObject({
      type: "article",
      title: samplePostDetail.title,
      publishedTime: samplePostDetail.date,
      modifiedTime: samplePostDetail.modified,
    });
  });

  it("includes featured image in Open Graph images", () => {
    const metadata = generateArticleMetadata(samplePostDetail);
    const og = metadata.openGraph;
    const images = og && "images" in og ? og.images : [];

    expect(images).toHaveLength(1);
    expect(images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: samplePostDetail.featuredImage?.node.sourceUrl,
          width: 1200,
          height: 800,
        }),
      ]),
    );
  });

  it("returns Twitter card summary_large_image", () => {
    const metadata = generateArticleMetadata(samplePostDetail);

    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: samplePostDetail.title,
    });
  });

  it("uses stripped excerpt when subtitle is absent", () => {
    const postNoSubtitle: PostDetailFieldsFragment = {
      ...samplePostDetail,
      articleFields: { subtitle: null, featured: false },
      excerpt: "<p>A summary of the electoral proposals.</p>",
    };

    const metadata = generateArticleMetadata(postNoSubtitle);

    expect(metadata.description).toBe("A summary of the electoral proposals.");
  });

  it("uses fallback description when no subtitle and no excerpt", () => {
    const postMinimal: PostDetailFieldsFragment = {
      ...samplePostDetail,
      articleFields: null,
      excerpt: null,
    };

    const metadata = generateArticleMetadata(postMinimal);

    expect(metadata.description).toBe("Your source for news");
  });

  it("returns empty images when no featured image", () => {
    const postNoImage: PostDetailFieldsFragment = {
      ...samplePostDetail,
      featuredImage: null,
    };

    const metadata = generateArticleMetadata(postNoImage);
    const og = metadata.openGraph;
    const images = og && "images" in og ? og.images : [];

    expect(images).toHaveLength(0);
    expect(metadata.twitter?.images).toHaveLength(0);
  });
});
