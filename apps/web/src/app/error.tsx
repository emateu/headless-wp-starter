"use client";

import Link from "next/link";
import { useEffect } from "react";
import { labels } from "~/lib/config/labels";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-4xl font-bold">{labels.errors.serverError}</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        {labels.errors.serverErrorDescription}
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {labels.errors.retry}
        </button>
        <Link href="/" className="text-primary hover:underline">
          {labels.errors.goHome}
        </Link>
      </div>
    </div>
  );
}
