import type { CategoryFieldsFragment } from "~/lib/graphql/__generated__/graphql";

export function CategoryBadge({
  category,
}: {
  category: CategoryFieldsFragment;
}) {
  return (
    <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
      {category.name}
    </span>
  );
}
