import type {
  CategoryFieldsFragment,
  PostCardFieldsFragment,
  PostDetailFieldsFragment,
  SliceFieldsFragment,
} from "~/lib/graphql/__generated__/graphql";

export const sampleCategory: CategoryFieldsFragment = {
  __typename: "Category",
  databaseId: 1,
  name: "Politics",
  slug: "politics",
};

export const samplePostCard: PostCardFieldsFragment = {
  __typename: "Post",
  databaseId: 42,
  title: "2026 Elections: candidates present their platforms",
  slug: "2026-elections-candidates",
  date: "2026-03-15T10:30:00",
  excerpt: "<p>A summary of the electoral proposals.</p>",
  featuredImage: {
    node: {
      __typename: "MediaItem",
      databaseId: 100,
      sourceUrl: "https://wp.example.com/uploads/elections.jpg",
      altText: "Candidates in debate",
      mediaDetails: { width: 1200, height: 800 },
    },
  },
  categories: { nodes: [sampleCategory] },
  articleFields: {
    subtitle: "Leading candidates debate on economy and security",
    featured: true,
  },
};

export const samplePostDetail: PostDetailFieldsFragment = {
  ...samplePostCard,
  modified: "2026-03-16T08:00:00",
  tags: {
    nodes: [
      {
        __typename: "Tag",
        databaseId: 10,
        name: "2026 Elections",
        slug: "2026-elections",
      },
    ],
  },
  contentSlices: {
    contentSlices: [
      {
        __typename: "ContentSlicesContentSlicesRichTextLayout",
        fieldGroupName: "ContentSlicesContentSlicesRichTextLayout",
        content: "<p>Article content goes here.</p>",
      },
      {
        __typename: "ContentSlicesContentSlicesQuoteLayout",
        fieldGroupName: "ContentSlicesContentSlicesQuoteLayout",
        text: "Democracy is the government of the people.",
        author: "Abraham Lincoln",
      },
    ],
  },
};

export const samplePostCardMinimal: PostCardFieldsFragment = {
  __typename: "Post",
  databaseId: 43,
  title: "Article without image or subtitle",
  slug: "article-minimal",
  date: "2026-03-20T14:00:00",
  excerpt: null,
  featuredImage: null,
  categories: null,
  articleFields: null,
};

export const sampleSlices: SliceFieldsFragment[] = [
  {
    __typename: "ContentSlicesContentSlicesRichTextLayout",
    fieldGroupName: "ContentSlicesContentSlicesRichTextLayout",
    content: "<p>First paragraph.</p>",
  },
  {
    __typename: "ContentSlicesContentSlicesQuoteLayout",
    fieldGroupName: "ContentSlicesContentSlicesQuoteLayout",
    text: "An important quote.",
    author: "Author",
  },
  {
    __typename: "ContentSlicesContentSlicesInfoboxLayout",
    fieldGroupName: "ContentSlicesContentSlicesInfoboxLayout",
    title: "Key fact",
    content: "<p>Relevant information.</p>",
  },
];
