"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, cardVariants } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/states";
import { SITES_LAYOUT_GROUP, SiteFigures } from "@/components/site-figures";
import { SiteSortBar, sortRows } from "@/components/site-sort-bar";
import type { CollectionFilters, SortKey } from "@/lib/data";
import { STATUS_FILL, STATUS_LABEL, WORKLOADS, WORKLOAD_KEYS, hourLabel, summarizeSite, type SiteSummary } from "@/lib/heat";
import { SITES_CHANGED_EVENT, loadLocalSites } from "@/lib/site-store";
import { cn } from "@/lib/utils";

/**
 * The site collection, home of three kit K7 signatures:
 * 1. AutoAnimate moves rows when filters, search or sort change, and when a site is added.
 * 2. Each row's name and figure block carry layoutIds (`site-${slug}-name`, `site-${slug}-figure`).
 *    "Quick look" morphs the row in place into an expanded plan panel; the same ids sit on the
 *    detail header in PlanView, so the full page opens on the same shapes.
 * 3. SiteSortBar reorders rows by a real figure and outlines that figure in every row.
 * All filter and sort state is mirrored in the URL.
 */
export function SiteCollection({ seeds, initial }: { seeds: SiteSummary[]; initial: CollectionFilters }) {
  const [filters, setFilters] = useState<CollectionFilters>(initial);
  const [local, setLocal] = useState<SiteSummary[]>([]);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [listRef] = useAutoAnimate<HTMLUListElement>({ duration: 320, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" });

  useEffect(() => {
    // Sites made on /new carry the hours saved when they were created.
    const reload = () => setLocal(loadLocalSites().map((s) => summarizeSite(s, s.snapshot ?? [])));
    reload();
    // The demo reset clears the list while this page is open.
    window.addEventListener(SITES_CHANGED_EVENT, reload);
    return () => window.removeEventListener(SITES_CHANGED_EVENT, reload);
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
    return sortRows(all, filters.sort);
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
        </div>
        <SiteSortBar value={filters.sort} onChange={(sort) => update({ sort })} />
      </Card>

      <LayoutGroup id={SITES_LAYOUT_GROUP}>
        <ul ref={listRef} className="space-y-3" aria-live="polite">
          {rows.map((r) => (
            <li key={r.slug}>
              <SiteRow
                row={r}
                sort={filters.sort}
                open={openSlug === r.slug}
                onToggle={() => setOpenSlug((cur) => (cur === r.slug ? null : r.slug))}
              />
            </li>
          ))}
          {rows.length === 0 && (
            <li>
              <EmptyState
                title="No site matches those filters."
                body="Sites whose name, trade, city or country match the search, workload and weather filters show up here. Clear the filters to bring back every site."
                cta="Clear filters"
                onAction={() => update({ q: "", work: "all", mode: "all" })}
              />
            </li>
          )}
        </ul>
      </LayoutGroup>
      <p className="max-w-[70ch] text-xs text-muted-foreground">
        Every row figure comes from the same WBGT engine as the site page.
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

function Strip({ row, labels = false }: { row: SiteSummary; labels?: boolean }) {
  return (
    <div aria-hidden className="grid grid-cols-24 gap-0.5">
      {row.strip.map((s, h) => {
        const inShift = h >= row.shiftStart && h < row.shiftStart + row.shiftHours;
        return (
          <span key={h} className="flex flex-col items-center gap-1">
            <span
              className={cn("w-full rounded-sm", labels ? "h-12" : "h-7", STATUS_FILL[s], inShift ? "opacity-100" : "opacity-40")}
            />
            {labels && (
              <span className={cn("text-[10px] leading-none text-muted-foreground", h % 3 !== 0 && "invisible")}>
                {String(h).padStart(2, "0")}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function SiteRow({
  row,
  sort,
  open,
  onToggle,
}: {
  row: SiteSummary;
  sort: SortKey;
  open: boolean;
  onToggle: () => void;
}) {
  const reduce = useReducedMotion();
  const saved = row.crewRestMin - row.best.crewRestMin;
  const panelId = `quick-look-${row.slug}`;
  const href = `/site/${row.slug}`;
  const shiftStatuses = row.strip.slice(row.shiftStart, row.shiftStart + row.shiftHours);
  const worst = shiftStatuses.includes("stop") ? "stop" : shiftStatuses.includes("rest") ? "rest" : null;

  return (
    <motion.div
      layout={reduce ? false : "position"}
      className={cn(cardVariants({ tone: open ? "deep" : "surface" }), "p-4 transition-colors hover:border-primary/60 sm:p-5", open && "border-primary/60")}
    >
      {open ? (
        <div id={panelId} className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <motion.p
                layoutId={reduce ? undefined : `site-${row.slug}-name`}
                className="break-words font-display text-3xl font-bold leading-tight"
              >
                <Link href={href} className="rounded-xl underline decoration-primary/50 underline-offset-4 hover:decoration-primary">
                  {row.name}
                </Link>
              </motion.p>
              <p className="text-sm text-muted-foreground">
                {row.trade} · {row.city}, {row.country} · {row.dateLabel} · {WORKLOADS[row.workload].label} work · crew of{" "}
                {row.crewSize}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
              Close quick look
            </Button>
          </div>
          <motion.div layoutId={reduce ? undefined : `site-${row.slug}-figure`}>
            <SiteFigures row={row} active={sort} size="lg" />
          </motion.div>
          <Strip row={row} labels />
          <p className="max-w-[70ch] text-sm">
            Shift {hourLabel(row.shiftStart)} to {hourLabel(row.shiftStart + row.shiftHours)}
            {worst ? `, worst hour: ${STATUS_LABEL[worst].toLowerCase()}.` : ", normal work all shift."}{" "}
            {saved > 0
              ? `Starting at ${hourLabel(row.best.start)} saves ${saved.toLocaleString("en-US")} crew-minutes of rest.`
              : "This start is already the best window."}
          </p>
          <Button asChild>
            <Link href={href}>
              Open the full plan
              <ArrowUpRight aria-hidden />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_minmax(0,19rem)_auto] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <motion.p
                layoutId={reduce ? undefined : `site-${row.slug}-name`}
                className="min-w-0 truncate font-display text-lg font-semibold"
                title={row.name}
              >
                <Link
                  href={href}
                  className="rounded-xl underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {row.name}
                </Link>
              </motion.p>
              {row.local && <Badge variant="gold">Yours</Badge>}
            </div>
            <p className="truncate text-sm text-muted-foreground" title={`${row.trade}, ${row.city}, ${row.country}`}>
              {row.trade} · {row.city}, {row.country}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.dateLabel} · {WORKLOADS[row.workload].label} work · crew of {row.crewSize}
            </p>
          </div>
          <Strip row={row} />
          <motion.div layoutId={reduce ? undefined : `site-${row.slug}-figure`}>
            <SiteFigures row={row} active={sort} />
          </motion.div>
          <Button type="button" variant="outline" size="sm" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
            Quick look
          </Button>
        </div>
      )}
    </motion.div>
  );
}
