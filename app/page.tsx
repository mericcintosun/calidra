import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LiveStripCell } from "@/components/live-strip-cell";
import { SceneSlot } from "@/components/scene-slot";
import { SiteCollection } from "@/components/site-collection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAdapter } from "@/lib/adapter";
import { parseFilters } from "@/lib/data";
import { hourLabel, summarizeSite } from "@/lib/heat";

export const metadata: Metadata = {
  title: { absolute: "Calidra: sun WBGT work/rest plans for outdoor crews" },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const initial = parseFilters(await searchParams);
  const adapter = getAdapter();
  const sites = await adapter.listSites();
  const results = await Promise.all(sites.map((s) => adapter.getHours(s, s.date)));
  const summaries = sites.map((s, i) => summarizeSite(s, results[i].hours));

  if (sites.length === 0) {
    return (
      <Card className="flex flex-col items-start gap-3 p-6">
        <h1 className="text-3xl font-bold">No crew sites yet</h1>
        <p className="text-muted-foreground">The seed list is empty. Add one from a place search.</p>
        <Button asChild>
          <Link href="/new">Plan a site</Link>
        </Button>
      </Card>
    );
  }

  const featured = sites[0];
  const featuredHours = results[0].hours;
  const f = summaries[0];
  const saved = f.crewRestMin - f.best.crewRestMin;

  return (
    <div className="space-y-16">
      {/* L4 bento: six unequal cells, no hero copy block above the grid. */}
      <section aria-label="Calidra at a glance" className="calidra-drop-group grid gap-3 lg:grid-cols-12">
        <Card className="flex flex-col justify-between gap-8 p-7 sm:p-9 lg:col-span-7 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <div className="space-y-5">
            <p className="text-sm font-semibold text-gold">For crew leads in construction, farming and landscaping</p>
            <h1 className="max-w-[16ch] text-4xl font-bold leading-[1.02] sm:text-5xl lg:text-6xl">
              Heat index assumes shade. Your crew works in the sun.
            </h1>
            <p className="max-w-[58ch] text-base text-muted-foreground sm:text-lg">
              Calidra turns tomorrow&apos;s hourly weather into in-sun WBGT, then tells you how many minutes of every hour
              your crew can work, how much shorter the plan must be for new hires, and which shift start loses the least time.
            </p>
          </div>
          <p className="max-w-[60ch] border-l-2 border-gold pl-4 text-sm">
            {featured.city}, {f.dateLabel}: sun WBGT reached {f.peakWbgtC.toFixed(1)}°C at {hourLabel(f.peakHour)}. A{" "}
            {featured.crewSize}-person framing crew starting at {hourLabel(featured.shiftStart)} owed{" "}
            {f.crewRestMin.toLocaleString("en-US")} crew-minutes of rest.
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
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold leading-tight">Plan tomorrow for your crew</h2>
            <p className="text-sm text-muted-foreground">City, workload, crew size. Three inputs, real forecast.</p>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link href="/new">Plan a site</Link>
          </Button>
        </Card>

        <Card tone="deep" className="flex flex-col justify-between gap-3 p-6 lg:col-span-2 lg:col-start-11 lg:row-start-2">
          <p className="font-display text-5xl font-bold text-primary">15°F</p>
          <p className="text-sm text-muted-foreground">
            How far OSHA says the heat index can read low in full sun. WBGT counts the sun.
          </p>
        </Card>

        <Card className="p-6 lg:col-span-8 lg:col-start-1 lg:row-start-3">
          <LiveStripCell site={featured} hours={featuredHours} />
        </Card>

        <Card tone="deep" className="flex flex-col justify-between gap-4 p-6 lg:col-span-4 lg:col-start-9 lg:row-start-3">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold leading-tight">Physics, not a lookup table</h2>
            <p className="text-sm text-muted-foreground">
              Globe and natural wet bulb temperatures are solved by iteration from temperature, humidity, sunlight and
              wind, every hour, in your browser.
            </p>
          </div>
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
          >
            Read the method and its limits
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </Card>
      </section>

      <section id="sites" aria-labelledby="sites-title" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 id="sites-title" className="text-3xl font-bold">
              Crew sites
            </h2>
            <p className="max-w-[65ch] text-muted-foreground">
              Seven real heat days replayed from the archive and three southern hemisphere sites on tomorrow&apos;s
              forecast. Each strip is 24 hours; the bright stretch is the planned shift.
            </p>
          </div>
        </div>
        <SiteCollection seeds={summaries} initial={initial} />
      </section>
    </div>
  );
}
