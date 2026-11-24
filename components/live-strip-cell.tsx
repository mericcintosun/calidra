"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import type { HourlyWeather, Site, Workload } from "@/lib/data";
import {
  STATUS_FILL,
  STATUS_LABEL,
  WORKLOADS,
  WORKLOAD_KEYS,
  bestStart,
  computeHeat,
  formatSiteDate,
  hourLabel,
  planDay,
  shiftTotals,
  type HourStatus,
} from "@/lib/heat";
import { cn } from "@/lib/utils";

/**
 * The live product cell of the bento: one seeded site, a workload switch, a real 24 hour plan.
 * Hovering the cell or moving keyboard focus into it expands it (Motion `layout`): taller bars
 * with every hour labeled and a readout of the peak hour, the stop-work hours and the best start.
 * Under reduced motion the same content appears without the layout animation.
 */
export function LiveStripCell({ site, hours }: { site: Site; hours: HourlyWeather[] }) {
  const reduce = useReducedMotion();
  const [workload, setWorkload] = useState<Workload>(site.workload);
  const [expanded, setExpanded] = useState(false);
  const settings = { ...site, workload };
  const heat = useMemo(() => computeHeat(hours, site.lat, site.lon), [hours, site.lat, site.lon]);
  const plan = useMemo(() => planDay(heat, { ...site, workload }), [heat, site, workload]);
  const totals = shiftTotals(plan, settings);
  const best = bestStart(plan, settings);
  const shift = plan.filter((h) => h.hour >= site.shiftStart && h.hour < site.shiftStart + site.shiftHours);
  const stopList = shift.filter((h) => h.status === "stop");
  const stops = stopList.length;
  const peak = plan.reduce<(typeof plan)[number] | undefined>((a, h) => (!a || h.wbgtC > a.wbgtC ? h : a), undefined);
  const scale = expanded ? 1.35 : 0.9;

  return (
    <motion.div
      layout={!reduce}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setExpanded(false);
      }}
      className="flex h-full flex-col gap-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          <Link
            href={`/site/${site.slug}`}
            className="inline-flex min-h-11 items-center font-semibold text-foreground underline decoration-gold underline-offset-4"
          >
            {site.city}, {formatSiteDate(site.date)}
          </Link>{" "}
          · crew of {site.crewSize} · shift {hourLabel(site.shiftStart)} to {hourLabel(site.shiftStart + site.shiftHours)}
        </p>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Workload">
          {WORKLOAD_KEYS.map((k) => (
            <Button key={k} type="button" size="sm" variant="outline" aria-pressed={workload === k} onClick={() => setWorkload(k)}>
              {WORKLOADS[k].label}
            </Button>
          ))}
        </div>
      </div>
      <motion.div
        layout={!reduce}
        className="grid grid-cols-24 gap-0.5"
        role="img"
        aria-label={`Hourly plan for ${WORKLOADS[workload].label.toLowerCase()} work`}
      >
        {plan.map((h) => (
          <div
            key={h.hour}
            className={cn("flex flex-col items-center justify-end gap-1", expanded ? "h-32" : "h-24")}
            title={`${hourLabel(h.hour)} · WBGT ${h.wbgtC}°C · ${STATUS_LABEL[h.status]}`}
          >
            <span
              className={cn(
                "w-full rounded-sm transition-[height] duration-300 motion-reduce:transition-none",
                STATUS_FILL[h.status],
                h.hour >= site.shiftStart && h.hour < site.shiftStart + site.shiftHours ? "opacity-100" : "opacity-40"
              )}
              style={{ height: `${Math.max(10, (60 - h.workMin) * scale + 10)}px` }}
            />
            <span
              className={cn(
                "text-[10px] leading-none text-muted-foreground",
                h.hour % (expanded ? 3 : 6) !== 0 && "invisible"
              )}
            >
              {String(h.hour).padStart(2, "0")}
            </span>
          </div>
        ))}
      </motion.div>
      <p className="mt-auto max-w-[62ch] text-sm">
        At {WORKLOADS[workload].label.toLowerCase()} work this crew owes{" "}
        <span className="font-display text-base font-semibold">{totals.crewRestMin.toLocaleString("en-US")} crew-minutes</span> of
        rest in the shift, with {stops} {stops === 1 ? "hour" : "hours"} where work must stop. Taller bars mean more rest.
      </p>
      {expanded && (
        <motion.dl
          layout={!reduce}
          className="grid gap-2 rounded-xl border border-line bg-deep p-3 text-sm sm:grid-cols-3"
        >
          <div>
            <dt className="text-xs text-muted-foreground">Peak sun WBGT</dt>
            <dd className="font-display font-semibold">
              {peak ? `${peak.wbgtC}°C at ${hourLabel(peak.hour)}` : "No hours"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Stop work in the shift</dt>
            <dd className="font-display font-semibold">
              {stops > 0 ? stopList.map((h) => hourLabel(h.hour)).join(", ") : "None"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Best start for this workload</dt>
            <dd className="font-display font-semibold">
              {hourLabel(best.start)}, {best.crewRestMin.toLocaleString("en-US")} crew-min rest
            </dd>
          </div>
        </motion.dl>
      )}
      <Legend />
    </motion.div>
  );
}

export function Legend() {
  const items: HourStatus[] = ["work", "pace", "rest", "stop"];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-sm", STATUS_FILL[s])} aria-hidden />
          {STATUS_LABEL[s]}
        </li>
      ))}
    </ul>
  );
}
