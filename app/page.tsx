import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LiveStripCell } from "@/components/live-strip-cell";
import { SceneSlot } from "@/components/scene-slot";
import { SiteCollection } from "@/components/site-collection";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAdapter } from "@/lib/adapter";
import { parseFilters } from "@/lib/data";
import { hourLabel, summarizeSite } from "@/lib/heat";

export const metadata: Metadata = {
  title: { absolute: "Calidra: sun WBGT work/rest plans for outdoor crews" },
};

/** DEMO.md step 2: the Phoenix plan the claim and live cells point at. */
const DEMO_SLUG = "phoenix-desert-ridge-framing";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const initial = parseFilters(await searchParams);
  const adapter = getAdapter();
  const sites = await adapter.listSites();
  // Real mode: one Open-Meteo call per site, served from the Next.js data cache
  // (30 min for forecast days, 24 h for archive days, set in lib/config.ts), so repeat
  // visits and filter changes do not hit Open-Meteo again. Failures fall back to seed.
  const results = await Promise.all(sites.map((s) => adapter.getHours(s, s.date)));
  const summaries = sites.map((s, i) => summarizeSite(s, results[i].hours));

  if (sites.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="sr-only">Crew sites</h1>
        <EmptyState
          title="No crew sites yet"
          body="Crew sites appear here with their 24 hour strip and peak sun WBGT. Plan one from a place search and a date to add the first."
          href="/new"
          cta="Plan a site"
        />
      </div>
    );
  }

  const fi = Math.max(
    sites.findIndex((s) => s.slug === DEMO_SLUG),
    0
  );
  const featured = sites[fi];
  const featuredHours = results[fi].hours;
  const f = summaries[fi];
  const saved = f.crewRestMin - f.best.crewRestMin;
  const live = adapter.mode === "real";

  return (
    <div className="space-y-16">
      {/* L4 bento on a 12 column grid. Cell sizes at lg (cols x rows): claim 7x2, image 5x1,
          CTA 3x1, sun gap 2x1, live product 8x1, method 4x1. No two match; no copy above the grid. */}
      <section aria-label="Calidra at a glance" className="calidra-drop-group grid gap-3 lg:grid-cols-12">
        <Card className="flex flex-col justify-between gap-8 p-7 sm:p-9 lg:col-span-7 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <div className="space-y-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-gold" />
              For outdoor crew leads in construction, farming and landscaping
            </p>
            <h1 className="max-w-[16ch] text-4xl font-bold leading-[1.02] sm:text-5xl lg:text-6xl">
              Heat index assumes shade. Your crew works in the sun.
            </h1>
            <p className="max-w-[58ch] text-base text-muted-foreground sm:text-lg">
              Calidra turns tomorrow&apos;s weather into in-sun WBGT and work/rest minutes for every hour.
            </p>
          </div>
          <p className="max-w-[60ch] border-l-2 border-gold pl-4 text-sm">
            <Link
              href={`/site/${DEMO_SLUG}`}
              className="font-semibold underline decoration-primary/60 underline-offset-4 hover:decoration-primary"
            >
              {featured.city}, {f.dateLabel}
            </Link>
            : sun WBGT reached {f.peakWbgtC.toFixed(1)}°C at {hourLabel(f.peakHour)}. A {featured.crewSize}-person crew
            starting at {hourLabel(featured.shiftStart)} owed {f.crewRestMin.toLocaleString("en-US")} crew-minutes of rest.
            {saved > 0
              ? ` Starting at ${hourLabel(f.best.start)} cuts that by ${saved.toLocaleString("en-US")}.`
              : " No other start does better."}
          </p>
        </Card>

        <Card tone="deep" className="overflow-hidden p-0 lg:col-span-5 lg:col-start-8 lg:row-start-1">
          <SceneSlot
            n={1}
            alt="A framing crew resting under a shade canopy at sunrise beside a black globe thermometer on a tripod, with the desert sun rising behind unfinished timber walls"
            width={960}
            height={640}
            className="h-full object-cover"
          />
        </Card>

        <Card tone="glow" className="flex flex-col justify-between gap-5 p-6 lg:col-span-3 lg:col-start-8 lg:row-start-2">
          <h2 className="text-2xl font-semibold leading-tight">Which crew loses the most time to heat?</h2>
          <div className="flex flex-col gap-2">
            <Button asChild size="lg" className="w-full">
              <Link href="#sites">Compare the crew sites</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/new">Plan your own site</Link>
            </Button>
          </div>
        </Card>

        <Card tone="deep" className="flex flex-col justify-between gap-3 p-6 lg:col-span-2 lg:col-start-11 lg:row-start-2">
          <p className="font-display text-5xl font-bold text-primary">15°F</p>
          <p className="text-sm text-muted-foreground">How far OSHA says the heat index can read low in full sun.</p>
        </Card>

        <Card className="p-6 lg:col-span-8 lg:col-start-1 lg:row-start-3">
          <LiveStripCell site={featured} hours={featuredHours} />
        </Card>

        <Card tone="deep" className="flex flex-col justify-between gap-4 p-6 lg:col-span-4 lg:col-start-9 lg:row-start-3">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold leading-tight">Physics, not a lookup table</h2>
            <p className="text-sm text-muted-foreground">
              Globe and wet bulb temperatures are solved by iteration from sun, wind, heat and humidity, every hour.
            </p>
          </div>
          <Link
            href="/about"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
          >
            Read the method and its limits
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </Card>
      </section>

      <section id="sites" aria-labelledby="sites-title" className="scroll-mt-24 space-y-6">
        <div className="flex items-end justify-between gap-6">
          <div className="space-y-1">
            <h2 id="sites-title" className="text-3xl font-bold">
              Crew sites
            </h2>
            <p className="max-w-[65ch] text-muted-foreground">
              {live
                ? "Seven past heat days from the Open-Meteo archive and three southern hemisphere sites on tomorrow's forecast."
                : "Seven past heat days and three southern hemisphere sites, from stored sample day profiles in this deploy."}
            </p>
          </div>
          <div className="w-28 shrink-0 overflow-hidden rounded-2xl border border-line bg-deep sm:w-40">
            <SceneSlot
              n={5}
              alt="A sun disc hanging over a 24 hour strip of colored bars, green at dawn, gold and coral at midday, with a small clock face at the side"
              width={640}
              height={600}
            />
          </div>
        </div>
        <SiteCollection seeds={summaries} initial={initial} />
      </section>
    </div>
  );
}
