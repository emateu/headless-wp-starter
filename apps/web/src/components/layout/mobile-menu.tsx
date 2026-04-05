"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { labels } from "~/lib/config/labels";
import type { MenuItemFieldsFragment } from "~/lib/graphql/__generated__/graphql";
import { menuItemPath } from "~/lib/utils/menu";
import { SearchForm } from "./search-form";

export function MobileMenu({ items }: { items: MenuItemFieldsFragment[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" />}
      >
        <Menu className="size-5" />
        <span className="sr-only">{labels.nav.menu}</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>{labels.nav.menu}</SheetTitle>
        </SheetHeader>
        <div className="px-4 py-3">
          <SearchForm onSubmit={() => setOpen(false)} />
        </div>
        <nav className="flex flex-col px-4 pb-4">
          {items.map((item) => (
            <div key={item.id}>
              <Link
                href={menuItemPath(item)}
                className="block py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
              {item.childItems?.nodes && item.childItems.nodes.length > 0 && (
                <div className="ml-4 border-l pl-3">
                  {item.childItems.nodes.map((child) => (
                    <Link
                      key={child.id}
                      href={menuItemPath(child)}
                      className="block py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
