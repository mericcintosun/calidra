"use client";

import { motion, useReducedMotion } from "motion/react";
import { Segmented, type SegmentedOption } from "@/components/ui/segmented";
import type { SortKey } from "@/lib/data";
import type { SiteSummary } from "@/lib/heat";

/** Hours inside the site's own shift where its plan says stop work (from summarizeSite's strip). */
export function stopHours(row: SiteSummary): number {
  let n = 0;
  for (let h = row.shiftStart; h < row.shiftStart + row.shiftHours && h < row.strip.length; h++) {
    if (row.strip[h] === "stop") n++;
  }
  return n;
}

const OPTIONS: SegmentedOption<SortKey>[] = [
  { value: "peak", label: "Peak sun WBGT" },
  { value: "stops", label: "Stop-work hours" },
  { value: "rest", label: "Rest owed" },
  { value: "name", label: "Name" },
];

const EXPLAIN: Record<SortKey, string> = {
  peak: "Hottest sun WBGT of the day first.",
  stops: "Most shift hours where work must stop first.",
  rest: "Most crew-minutes of rest owed in the current shift first.",
  name: "A to Z by crew name.",
};

/** Sorts rows by a real figure from summarizeSite. Ties fall back to name so the order is stable. */
export function sortRows(rows: SiteSummary[], key: SortKey): SiteSummary[] {
  const byName = (a: SiteSummary, b: SiteSummary) => a.name.localeCompare(b.name);
  const sorted = [...rows];
  if (key === "peak") sorted.sort((a, b) => b.peakWbgtC - a.peakWbgtC || byName(a, b));
  if (key === "stops") sorted.sort((a, b) => stopHours(b) - stopHours(a) || b.peakWbgtC - a.peakWbgtC || byName(a, b));
  if (key === "rest") sorted.sort((a, b) => b.crewRestMin - a.crewRestMin || byName(a, b));
  if (key === "name") sorted.sort(byName);
  return sorted;
}

/**
 * Kit K7 signature 3: an inline sort control. Each press reorders the collection by a real
 * computed figure (AutoAnimate moves the rows) and the highlight slides to the pressed segment
 * with a Motion layoutId. Under reduced motion the highlight jumps; the buttons work the same.
 */
export function SiteSortBar({ value, onChange }: { value: SortKey; onChange: (key: SortKey) => void }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sort by</span>
      <Segmented
        label="Sort crew sites"
        value={value}
        options={OPTIONS}
        onChange={onChange}
        indicator={
          <motion.span
            aria-hidden
            layoutId={reduce ? undefined : "site-sort-indicator"}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="absolute inset-0 rounded-xl bg-primary"
          />
        }
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {EXPLAIN[value]}
      </p>
    </div>
  );
}
