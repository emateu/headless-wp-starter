"use client";

import { useEffect, useState } from "react";
import { ShareIcon } from "~/components/icons/social";
import { labels } from "~/lib/config/labels";

interface NativeShareButtonProps {
  url: string;
  title: string;
}

export function NativeShareButton({ url, title }: NativeShareButtonProps) {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  if (!canShare) return null;

  async function handleNativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // User cancelled or share failed
    }
  }

  return (
    <button
      type="button"
      onClick={handleNativeShare}
      aria-label={labels.article.share}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <ShareIcon />
    </button>
  );
}
