import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PlanView, StoredSitePlan } from "@/components/plan-view";
import { getAdapter } from "@/lib/adapter";
import { parsePlanParams } from "@/lib/plan-params";
// Build time only: the seed list names the pages to prerender.
import { sites } from "@/lib/data/seed";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function generateStaticParams() {
  return sites.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getAdapter().getSite(slug);
  return {
    title: site ? `${site.name}, ${site.city}` : "Your site",
    description: site
      ? `Hour-by-hour sun WBGT and work/rest plan for ${site.name} in ${site.city}.`
      : "A crew site saved in this browser.",
  };
}

export default async function SitePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: SearchParams }) {
  const { slug } = await params;
  // Settings held in the URL (workload, clothing, crew, newWorkers, day, start, hours) override
  // the site's defaults; invalid values are dropped by parsePlanParams.
  const overrides = parsePlanParams(await searchParams);
  const adapter = getAdapter();
  const site = await adapter.getSite(slug);
  const initial = site ? await adapter.getHours(site, site.date) : undefined;
  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All crew sites
      </Link>
      {site && initial ? (
        <PlanView
          site={site}
          initialHours={initial.hours}
          initialSource={initial.source}
          initialDate={initial.date}
          mode={adapter.mode}
          overrides={overrides}
        />
      ) : (
        <StoredSitePlan slug={slug} />
      )}
    </div>
  );
}
