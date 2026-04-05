import Image from "next/image";
import Link from "next/link";
import { labels } from "~/lib/config/labels";
import type { LayoutData } from "~/lib/graphql/queries/get-layout-data";
import { menuItemPath } from "~/lib/utils/menu";
import { MobileMenu } from "./mobile-menu";
import { SearchForm } from "./search-form";

interface HeaderProps {
  menuItems: LayoutData["mainMenu"];
  siteSettings: LayoutData["siteSettings"];
}

export function Header({ menuItems, siteSettings }: HeaderProps) {
  const logo = siteSettings?.siteLogo?.node ?? null;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <MobileMenu items={menuItems} />

        <Link href="/" className="flex shrink-0 items-center gap-2">
          {logo ? (
            <Image
              src={logo.sourceUrl ?? ""}
              alt={logo.altText || labels.site.name}
              width={1}
              height={1}
              sizes="120px"
              className="h-8 w-auto"
              priority
            />
          ) : (
            <span className="text-lg font-bold tracking-tight">
              {labels.site.name}
            </span>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={menuItemPath(item)}
              className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="hidden md:block">
          <SearchForm />
        </div>
      </div>
    </header>
  );
}
