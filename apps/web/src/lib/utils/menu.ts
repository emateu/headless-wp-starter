import type { MenuItemFieldsFragment } from "~/lib/graphql/__generated__/graphql";

export function menuItemPath(item: MenuItemFieldsFragment): string {
  if (item.path) return item.path;
  if (!item.url) return "#";
  try {
    return new URL(item.url).pathname;
  } catch {
    return item.url;
  }
}
