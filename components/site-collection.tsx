"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CollectionFilters, SortKey } from "@/lib/data";
import { STATUS_FILL, WORKLOADS, WORKLOAD_KEYS, hourLabel, summarizeSite, type SiteSummary } from "@/lib/heat";
import { seedHours } from "@/lib/open-meteo";
import { loadLocalSites } from "@/lib/site-store";
import { cn } from "@/lib/utils";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "peak", label: "Hottest peak" },
  { key: "rest", label: "Most rest owed" },
  { key: "name", label: "Name" },
];

/**
 * Kit K7 signature 1: the site collection. Filtering by workload or data mode, searching,
 * and sorting by real computed values (peak sun WBGT, crew rest minutes) animate the rows
 * into their new positions with AutoAnimate. All filter state is mirrored in the URL.
 */
export function SiteCollection({ seeds, initial }: { seeds: SiteSummary[]; initial: CollectionFilters }) {
  const [filters, setFilters] = useState<CollectionFilters>(initial);
  const [local, setLocal] = useState<SiteSummary[]>([]);
  const [listRef] = useAutoAnimate<HTMLUListElement>({ duration: 320, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" });

  useEffect(() => {
    setLocal(loadLocalSites().map((s) => summarizeSite(s, seedHours(s))));
  }, []);

  function update(next: Partial<CollectionFilters>) {
    const merged = { ...filters, ...next };
    setFilters(merged);
    const qs = new URLSearchParams();
    if (merged.q) qs.set("q", merged.q);
    if (merged.work !== "all") qs.set("work", merged.work);
    if (merged.mode !== "all") qs.set("mode", merged.mode);
    if (merged.sort !== "peak") qs.set("sort", merged.sort);
    const s = qs.toString();
    // Native history keeps the URL shareable without a server round trip per keystroke.
    window.history.replaceState(null, "", s ? `/?${s}` : "/");
  }

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const all = [...local, ...seeds].filter((r) => {
      if (filters.work !== "all" && r.workload !== filters.work) return false;
      if (filters.mode !== "all" && r.mode !== filters.mode) return false;
      if (!q) return true;
      return [r.name, r.trade, r.city, r.country].some((f) => f.toLowerCase().includes(q));
    });
    const sorted = [...all];
    if (filters.sort === "peak") sorted.sort((a, b) => b.peakWbgtC - a.peakWbgtC);
    if (filters.sort === "rest") sorted.sort((a, b) => b.crewRestMin - a.crewRestMin);
    if (filters.sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [filters, local, seeds]);

  return (
    <div className="space-y-5">
      <Card tone="deep" className="flex flex-col gap-4 p-4 sm:p-5">
        <label className="relative block">
          <span className="sr-only">Search sites</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={filters.q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Search a crew, trade, city or country"
            className="pl-10"
          />
        </label>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
          <FilterGroup label="Workload">
            <Chip pressed={filters.work === "all"} onClick={() => update({ work: "all" })}>All</Chip>
            {WORKLOAD_KEYS.map((k) => (
              <Chip key={k} pressed={filters.work === k} onClick={() => update({ work: k })}>
                {WORKLOADS[k].label}
              </Chip>
            ))}
          </FilterGroup>
          <FilterGroup label="Weather">
            <Chip pressed={filters.mode === "all"} onClick={() => update({ mode: "all" })}>All</Chip>
            <Chip pressed={filters.mode === "archive"} onClick={() => update({ mode: "archive" })}>Past heat days</Chip>
            <Chip pressed={filters.mode === "forecast"} onClick={() => update({ mode: "forecast" })}>Tomorrow</Chip>
          </FilterGroup>
          <FilterGroup label="Sort">
            {SORTS.map((s) => (
              <Chip key={s.key} pressed={filters.sort === s.key} onClick={() => update({ sort: s.key })}>
                {s.label}
              </Chip>
            ))}
          </FilterGroup>
        </div>
      </Card>

      <ul ref={listRef} className="space-y-3" aria-live="polite">
        {rows.map((r) => (
          <li key={r.slug}>
            <SiteRow row={r} />
          </li>
        ))}
        {rows.length === 0 && (
          <li>
            <Card className="flex flex-col items-start gap-3 p-6">
              <p className="font-display text-lg font-semibold">No site matches those filters.</p>
              <p className="text-sm text-muted-foreground">Clear the search or pick another workload.</p>
              <Button variant="secondary" size="sm" onClick={() => update({ q: "", work: "all", mode: "all" })}>
                Clear filters
              </Button>
            </Card>
          </li>
        )}
      </ul>
      <p className="max-w-[70ch] text-xs text-muted-foreground">
        Row figures come from each site&apos;s stored day profile, run through the same WBGT engine. Open a site to load
        its live Open-Meteo hours.
      </p>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={label}>
      <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button type="button" variant="outline" size="sm" aria-pressed={pressed} onClick={onClick}>
      {children}
    </Button>
  );
}

function SiteRow({ row }: { row: SiteSummary }) {
  const saved = row.crewRestMin - row.best.crewRestMin;
  return (
    <Link href={`/site/${row.slug}`} className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className="grid gap-4 p-4 transition-colors group-hover:border-primary/60 sm:p-5 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,13rem)] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-display text-lg font-semibold">{row.name}</p>
            {row.local && <Badge variant="gold">Yours</Badge>}
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {row.trade} · {row.city}, {row.country}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.dateLabel} · {WORKLOADS[row.workload].label} work · crew of {row.crewSize}
          </p>
        </div>
        <div aria-hidden className="grid grid-cols-24 gap-0.5">
          {row.strip.map((s, h) => (
            <span
              key={h}
              className={cn(
                "h-7 rounded-sm",
                STATUS_FILL[s],
                h >= row.shiftStart && h < row.shiftStart + row.shiftHours ? "opacity-100" : "opacity-40"
              )}
            />
          ))}
        </div>
        <div className="text-sm">
          <p>
            Sun WBGT peaks at <span className="font-display text-lg font-semibold">{row.peakWbgtC.toFixed(1)}°C</span> at{" "}
            {hourLabel(row.peakHour)}
          </p>
          <p className="text-muted-foreground">
            {saved > 0
              ? `Starting at ${hourLabel(row.best.start)} saves ${saved.toLocaleString("en-US")} crew-minutes of rest`
              : `${hourLabel(row.shiftStart)} start is already the best window`}
          </p>
        </div>
      </Card>
    </Link>
  );
}
