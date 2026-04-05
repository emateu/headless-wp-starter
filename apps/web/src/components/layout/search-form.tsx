"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "~/components/ui/input";
import { labels } from "~/lib/config/labels";

export function SearchForm({ onSubmit }: { onSubmit?: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    onSubmit?.();
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={labels.nav.searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-8 h-8 w-full sm:w-48 lg:w-56"
      />
    </form>
  );
}
