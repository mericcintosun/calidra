import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PlanView, StoredSitePlan } from "@/components/plan-view";
import { findSeedSite, sites } from "@/lib/data";
import { seedHours } from "@/lib/open-meteo";

export function generateStaticParams() {
  return sites.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = findSeedSite(slug);
  return {
    title: site ? `${site.name}, ${site.city}` : "Your site",
    description: site
      ? `Hour-by-hour sun WBGT and work/rest plan for ${site.name} in ${site.city}.`
      : "A crew site saved in this browser.",
  };
}

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = findSeedSite(slug);
  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        All crew sites
      </Link>
      {site ? <PlanView site={site} initialHours={seedHours(site)} /> : <StoredSitePlan slug={slug} />}
    </div>
  );
}
