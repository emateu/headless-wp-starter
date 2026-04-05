import { Suspense } from "react";
import { LayoutA } from "~/components/home/layout-a";
import { LayoutC } from "~/components/home/layout-c";
import { getHomepageData } from "~/lib/graphql/queries/get-homepage-data";

function HomepageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Hero skeleton */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="col-span-full aspect-[3/2] rounded-lg bg-muted lg:col-span-2 lg:aspect-[16/9]" />
        <div className="col-span-full flex flex-col gap-4 lg:col-span-1">
          <div className="h-40 rounded-lg bg-muted" />
          <div className="h-40 rounded-lg bg-muted" />
        </div>
      </div>
      {/* Grid skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-64 rounded-lg bg-muted" />
        <div className="h-64 rounded-lg bg-muted" />
        <div className="h-64 rounded-lg bg-muted" />
      </div>
      {/* Banner skeleton */}
      <div className="h-48 rounded-lg bg-muted" />
    </div>
  );
}

async function HomepageContent() {
  const data = await getHomepageData();

  if (data.layout === "layout_c") {
    return <LayoutC data={data} />;
  }
  return <LayoutA data={data} />;
}

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Suspense fallback={<HomepageSkeleton />}>
        <HomepageContent />
      </Suspense>
    </div>
  );
}
