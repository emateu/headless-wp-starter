export const labels = {
  site: {
    name: "News Portal",
    fallbackDescription: "Your source for news",
  },
  nav: {
    search: "Search",
    searchPlaceholder: "Search articles...",
    menu: "Menu",
    close: "Close",
  },
  article: {
    featured: "Featured",
    publishedOn: "Published on",
    updatedOn: "Updated on",
    readMore: "Read more",
    shareOn: "Share on",
    share: "Share",
    relatedArticles: "Related articles",
  },
  home: {
    latestNews: "Latest news",
    mostRead: "Most read",
    trendingTags: "Trending",
    seeAll: "See all",
    newsletter: "Newsletter",
    highlightBanner: "Featured",
  },
  pagination: {
    previous: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
  },
  errors: {
    notFound: "Page not found",
    notFoundDescription:
      "The page you're looking for doesn't exist or has been moved.",
    serverError: "Server error",
    serverErrorDescription:
      "An unexpected error occurred. Please try again later.",
    searchSuggestion: "Looking for something? Try the search.",
    retry: "Try again",
    goHome: "Go to homepage",
    recentArticles: "Recent articles",
  },
  footer: {
    allRightsReserved: "All rights reserved.",
  },
  preview: {
    banner: "Preview mode",
    exit: "Exit preview",
  },
  ads: {
    label: "Advertisement",
  },
  archive: {
    categoryTitle: "{category}",
    categoryDescription: "Latest news about {category}",
    tagTitle: "{tag}",
    tagDescription: "Articles tagged with {tag}",
    noResults: "No articles found.",
    postsCount: "{count} articles",
  },
  search: {
    title: "Search results",
    resultsFor: 'Results for "{query}"',
    noQuery: "Enter a search term.",
    noResults: 'No articles found for "{query}".',
  },
  feed: {
    title: "News Portal",
    description: "Latest news from the portal",
    categoryFeedTitle: "News Portal — {category}",
    categoryFeedDescription: "Latest news about {category}",
  },
} as const;
