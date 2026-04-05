export const POSTS_PER_PAGE = 12;

/**
 * Compute WPGraphQL cursor for a given page number.
 * WPGraphQL uses base64-encoded "arrayconnection:{0-based-index}" cursors.
 * The `after` cursor points to the last item before the requested page.
 */
export function getCursorForPage(
  page: number,
  perPage: number = POSTS_PER_PAGE,
): string | undefined {
  if (page <= 1) return undefined;
  const offset = (page - 1) * perPage - 1;
  return btoa(`arrayconnection:${offset}`);
}
