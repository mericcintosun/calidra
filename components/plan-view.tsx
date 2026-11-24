"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LayoutGroup, animate, motion, useReducedMotion } from "motion/react";
import { CloudSun, Printer, Wind } from "lucide-react";
import { Legend } from "@/components/live-strip-cell";
import { SceneSlot } from "@/components/scene-slot";
import { SITES_LAYOUT_GROUP, SiteFigures } from "@/components/site-figures";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Range } from "@/components/ui/range";
import { hintFor, type ApiError } from "@/lib/errors";
import type { ApiResponse, HourlyResult, HourlyWeather, PlanSettings, Site, WeatherSource } from "@/lib/types";
import {
  CLOTHING,
  CLOTHING_KEYS,
  EARLIEST_START,
  STATUS_FILL,
  STATUS_LABEL,
  WORKLOADS,
  WORKLOAD_KEYS,
  bestStart,
  computeHeat,
  findBandGap,
  findMismatch,
  formatSiteDate,
  hourLabel,
  planDay,
  resolveDate,
  shiftTotals,
  summarizeSite,
  type HourPlan,
} from "@/lib/heat";
import { applyPlanParams, parsePlanParams, toPlanQuery, type PlanOverrides } from "@/lib/plan-params";
import { findLocalSite } from "@/lib/site-store";
import { EmptyState, PageSkeleton } from "@/components/states";
import { cn } from "@/lib/utils";

/** The adapter mode of this deploy, passed down from the server page. */
export type DataMode = "fake" | "real";

type LoadState =
  | { kind: "loading" }
  | { kind: "live"; source: WeatherSource; date: string }
  | { kind: "saved" }
  | { kind: "offline"; error: ApiError };

type HoursOutcome = { ok: true; data: HourlyResult } | { ok: false; error: ApiError };

/** Hours for a site through the adapter seam: /api/hours answers with the shared ApiResponse shape. */
async function loadHours(site: Site, signal: AbortSignal): Promise<HoursOutcome> {
  const qs = new URLSearchParams({
    slug: site.slug,
    lat: String(site.lat),
    lon: String(site.lon),
    date: resolveDate(site.date),
  });
  let body: ApiResponse<HourlyResult> | null = null;
  try {
    const res = await fetch(`/api/hours?${qs.toString()}`, { signal });
    body = (await res.json()) as ApiResponse<HourlyResult>;
  } catch {
    body = null;
  }
  if (!body) return { ok: false, error: { error: "upstream_error", hint: hintFor("upstream_error") } };
  if (!body.ok || !body.data) return { ok: false, error: body.error ?? { error: "parse_failure", hint: hintFor("parse_failure") } };
  return { ok: true, data: body.data };
}

/** The site detail: hours from the adapter, settings, the shift slider and the counter it moves. */
export function PlanView({
  site,
  initialHours,
  initialSource,
  initialDate,
  mode,
  overrides,
}: {
  site: Site;
  initialHours: HourlyWeather[];
  initialSource?: WeatherSource;
  /** The YYYY-MM-DD date the server resolved and fetched hours for. */
  initialDate?: string;
  mode?: DataMode;
  /** Settings read from the URL by parsePlanParams; missing keys keep the site's defaults. */
  overrides?: PlanOverrides;
}) {
  const [hours, setHours] = useState<HourlyWeather[]>(initialHours);
  // Sites made on /new keep the hours saved at creation and do not refetch.
  const hasSnapshot = Boolean(site.createdLocally && site.snapshot && site.snapshot.length > 0);
  // The server already rendered hours from the adapter, so the badge names their source from
  // the first paint (and with JavaScript off); the client refresh below may replace them.
  const [load, setLoad] = useState<LoadState>(
    hasSnapshot
      ? { kind: "saved" }
      : initialSource
        ? { kind: "live", source: initialSource, date: site.date }
        : { kind: "loading" }
  );
  const [s, setS] = useState<PlanSettings>(() => applyPlanParams(site, overrides));
  const [selected, setSelected] = useState<number>(13);
  // The hour under the pointer or keyboard focus, and where its breakdown popover sits.
  const [peek, setPeek] = useState<{ hour: number; left: number } | null>(null);
  const stripWrap = useRef<HTMLDivElement>(null);
  // Bumped by the "Retry live hours" button; any value above 0 forces one more request.
  const [retry, setRetry] = useState(0);
  const query = toPlanQuery(s);

  // Mirror the settings into the URL so a shared link (or the crew sheet QR) opens this exact
  // plan. Native replaceState: no navigation, no server refetch, no rerender loop. The first
  // render is skipped so opening a plain site link does not rewrite its address.
  const wroteOnce = useRef(false);
  useEffect(() => {
    if (!wroteOnce.current) {
      wroteOnce.current = true;
      return;
    }
    window.history.replaceState(window.history.state, "", `${window.location.pathname}?${query}`);
  }, [query]);

  // The server page already rendered hours from the adapter, so the browser only asks again
  // when that is worth it: in real mode after a seed fallback (try live once more), in real mode
  // when the browser's calendar resolves the site date to another day than the server did, when
  // no hours came with the page, or when the lead presses retry. Fake mode never refetches.
  useEffect(() => {
    if (hasSnapshot) return;
    const realNeedsLive =
      mode === "real" && (initialSource === "seed" || (initialDate !== undefined && resolveDate(site.date) !== initialDate));
    if (!(retry > 0 || !initialSource || realNeedsLive)) return;
    const ctrl = new AbortController();
    void loadHours(site, ctrl.signal).then((r) => {
      if (ctrl.signal.aborted) return;
      if (!r.ok) {
        // Live hours already on screen from the server render stay labeled live.
        const error = r.error;
        setLoad((prev) => (prev.kind === "live" && prev.source !== "seed" ? prev : { kind: "offline", error }));
        return;
      }
      if (r.data.hours.length > 0) setHours(r.data.hours);
      setLoad({ kind: "live", source: r.data.source, date: r.data.date });
    });
    return () => ctrl.abort();
    // Site fields are listed one by one so a new object for the same place does not refetch.
  }, [site.slug, site.lat, site.lon, site.date, hasSnapshot, mode, initialSource, initialDate, retry]);

  const reduce = useReducedMotion();
  // The same summary the collection row shows (summarizeSite at the site's own settings), so the
  // figure block the row morphs from carries identical numbers here.
  const summary = useMemo(() => summarizeSite(site, hours), [site, hours]);
  const heat = useMemo(() => computeHeat(hours, site.lat, site.lon), [hours, site.lat, site.lon]);
  const plan = useMemo(() => planDay(heat, s), [heat, s]);
  const totals = shiftTotals(plan, s);
  const best = bestStart(plan, s);
  const shift = plan.filter((h) => h.hour >= s.shiftStart && h.hour < s.shiftStart + s.shiftHours);
  // A "Caution" hour that WBGT calls rest or stop first; on days with none (the Phoenix seed),
  // the lowest heat index band among the rest or stop hours. The sentence prints the real band.
  const mismatch = findMismatch(shift) ?? findMismatch(plan) ?? findBandGap(plan);
  const retryLive = () => {
    setLoad({ kind: "loading" });
    setRetry((n) => n + 1);
  };
  const focus = plan.find((h) => h.hour === selected) ?? plan[0];
  const peekPlan = peek ? plan.find((h) => h.hour === peek.hour) : undefined;
  // Centers the breakdown over the hovered or focused column, kept inside the strip's box.
  const peekAt = (hour: number, el: HTMLElement) => {
    const wrap = stripWrap.current;
    if (!wrap) return;
    const box = wrap.getBoundingClientRect();
    const col = el.getBoundingClientRect();
    const half = BREAKDOWN_HALF_PX;
    const center = col.left + col.width / 2 - box.left;
    setPeek({ hour, left: Math.min(Math.max(center, half), Math.max(half, box.width - half)) });
  };
  const maxStart = 24 - s.shiftHours;
  const set = (patch: Partial<PlanSettings>) => setS((prev) => ({ ...prev, ...patch }));
  const newCount = Math.min(s.newWorkers, s.crewSize);

  return (
    <div className="calidra-drop-group space-y-6">
      <LayoutGroup id={SITES_LAYOUT_GROUP}>
      <div className="flex flex-col gap-3">
        <p
          className="flex items-center gap-2 break-words text-sm font-semibold text-muted-foreground"
          title={`${site.trade}, ${site.city}, ${site.region}, ${site.country}`}
        >
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-gold" />
          {site.trade} · {site.city}, {site.region}, {site.country}
        </p>
        {/* Kit K7 signature 2: the same layoutIds as the collection row's name and figure block. */}
        <motion.h1
          layoutId={reduce ? undefined : `site-${site.slug}-name`}
          className="break-words text-4xl font-bold leading-tight sm:text-5xl"
          title={site.name}
        >
          {site.name}
        </motion.h1>
        <p className="max-w-[70ch] break-words text-muted-foreground">{site.note}</p>
        <motion.div layoutId={reduce ? undefined : `site-${site.slug}-figure`} className="max-w-2xl">
          <SiteFigures row={summary} size="lg" />
        </motion.div>
        <p className="text-xs text-muted-foreground">
          Figures above use the site&apos;s saved plan: crew of {site.crewSize}, start {hourLabel(site.shiftStart)}. The counter
          below follows your settings.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary">{load.kind === "live" ? formatSiteDate(load.date) : formatSiteDate(site.date)}</Badge>
          <SourceBadge load={load} />
          {/* The print sheet reads seed sites through the adapter; browser-saved sites have none yet. */}
          {!site.createdLocally && (
            <Button asChild variant="secondary" size="sm" className="ml-auto">
              <Link href={`/site/${site.slug}/print?${query}`}>
                <Printer aria-hidden />
                Crew sheet
              </Link>
            </Button>
          )}
        </div>
        <DataStatement load={load} mode={mode} />
        {load.kind === "offline" && (
          <div>
            <Button type="button" variant="secondary" size="sm" onClick={retryLive}>
              Retry live hours
            </Button>
          </div>
        )}
      </div>
      </LayoutGroup>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <Card tone="glow" className="flex flex-col gap-5 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Required rest in this shift</p>
              <p className="font-display text-5xl font-bold leading-none">
                <RollingNumber value={totals.crewRestMin} />
                <span className="ml-2 text-lg font-semibold text-muted-foreground">crew-min</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Productive time</p>
              <p className="font-display text-5xl font-bold leading-none">
                <RollingNumber value={Math.round(totals.crewWorkMin / 6) / 10} decimals={1} />
                <span className="ml-2 text-lg font-semibold text-muted-foreground">crew-h</span>
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="shift-start" className="font-semibold">
                Shift start {hourLabel(s.shiftStart)} to {hourLabel(s.shiftStart + s.shiftHours)}
              </label>
              <span className="text-muted-foreground">{s.shiftHours} h</span>
            </div>
            <Range
              id="shift-start"
              min={EARLIEST_START}
              max={maxStart}
              step={1}
              value={Math.min(s.shiftStart, maxStart)}
              onChange={(e) => set({ shiftStart: Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {best.start !== s.shiftStart && best.crewWorkMin > totals.crewWorkMin ? (
              <>
                <Badge variant="gold">
                  Best window {hourLabel(best.start)} to {hourLabel(best.start + s.shiftHours)}, saves{" "}
                  {(totals.crewRestMin - best.crewRestMin).toLocaleString("en-US")} crew-min
                </Badge>
                <Button size="sm" onClick={() => set({ shiftStart: best.start })}>
                  Use best start
                </Button>
              </>
            ) : (
              <Badge variant="ok">This start is the best window for the day</Badge>
            )}
          </div>
          {mismatch && (
            <p className="rounded-xl border border-line bg-surface p-3 text-sm">
              At {hourLabel(mismatch.hour)} the heat index reads <strong>{mismatch.hiBand}</strong> ({mismatch.heatIndexC}°C). In
              the sun, WBGT is {mismatch.wbgtC}°C and the plan says <strong>{STATUS_LABEL[mismatch.status].toLowerCase()}</strong>.
            </p>
          )}
        </Card>

        <div className="flex flex-col gap-4">
        <Card tone="deep" className="flex flex-col gap-4 p-6">
          <SettingGroup label="Workload">
            {WORKLOAD_KEYS.map((k) => (
              <Button key={k} size="sm" variant="outline" aria-pressed={s.workload === k} onClick={() => set({ workload: k })}>
                {WORKLOADS[k].label}
              </Button>
            ))}
          </SettingGroup>
          <SettingGroup label="Clothing">
            {CLOTHING_KEYS.map((k) => (
              <Button key={k} size="sm" variant="outline" aria-pressed={s.clothing === k} onClick={() => set({ clothing: k })}>
                {CLOTHING[k].label}
              </Button>
            ))}
          </SettingGroup>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="space-y-1">
              <span className="font-semibold">Crew size</span>
              <Input
                type="number"
                min={1}
                max={60}
                value={s.crewSize}
                onChange={(e) => set({ crewSize: clampInt(e.target.value, 1, 60) })}
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold">New this week</span>
              <Input
                type="number"
                min={0}
                max={s.crewSize}
                value={s.newWorkers}
                onChange={(e) => set({ newWorkers: clampInt(e.target.value, 0, s.crewSize) })}
              />
            </label>
          </div>
          <SettingGroup label="New workers' day on the job">
            {[1, 2, 3, 4, 5].map((d) => (
              <Button key={d} size="sm" variant="outline" aria-pressed={s.newWorkerDay === d} onClick={() => set({ newWorkerDay: d })}>
                Day {d}
              </Button>
            ))}
          </SettingGroup>
          <SettingGroup label="Shift length">
            {[6, 8, 10].map((n) => (
              <Button
                key={n}
                size="sm"
                variant="outline"
                aria-pressed={s.shiftHours === n}
                onClick={() => set({ shiftHours: n, shiftStart: Math.min(s.shiftStart, 24 - n) })}
              >
                {n} h
              </Button>
            ))}
          </SettingGroup>
        </Card>
        <Card className="overflow-hidden p-0">
          <SceneSlot
            n={4}
            alt="A sun disc sliding along a track above a row of hour blocks, with a gold outlined shift window moving from midday toward dawn"
            width={880}
            height={440}
          />
        </Card>
        </div>
      </div>

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-2xl font-semibold">Hour by hour</h2>
          <Legend />
        </div>
        {/* The breakdown popover sits outside the scroll box so it is never clipped. */}
        <div ref={stripWrap} className="relative" onMouseLeave={() => setPeek(null)}>
          <div className="overflow-x-auto pb-2">
            <div className="grid min-w-[60rem] grid-cols-24 gap-1">
              {plan.map((h) => (
                <HourColumn
                  key={h.hour}
                  h={h}
                  inShift={h.hour >= s.shiftStart && h.hour < s.shiftStart + s.shiftHours}
                  selected={h.hour === selected}
                  showNew={newCount > 0}
                  describedBy={peek?.hour === h.hour ? BREAKDOWN_ID : undefined}
                  onSelect={() => setSelected(h.hour)}
                  onPeek={(el) => peekAt(h.hour, el)}
                  onUnpeek={() => setPeek(null)}
                />
              ))}
            </div>
          </div>
          {peek && peekPlan && <HourBreakdown h={peekPlan} left={peek.left} newCount={newCount} />}
        </div>
        {plan.length === 0 && (
          <EmptyState
            title="No hourly data for this site yet"
            body="The weather request returned no hours for this place and date. Plan the site again with another date."
            href="/new"
            cta="Plan a new site"
          />
        )}
        {focus && <HourDetail h={focus} newCount={newCount} />}
      </Card>
    </div>
  );
}

const BREAKDOWN_ID = "hour-breakdown";
/** Half the popover width (w-68 is 17rem, 272 px). */
const BREAKDOWN_HALF_PX = 136;

function HourColumn({
  h,
  inShift,
  selected,
  showNew,
  describedBy,
  onSelect,
  onPeek,
  onUnpeek,
}: {
  h: HourPlan;
  inShift: boolean;
  selected: boolean;
  showNew: boolean;
  describedBy?: string;
  onSelect: () => void;
  onPeek: (el: HTMLElement) => void;
  onUnpeek: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-pressed={selected}
      aria-describedby={describedBy}
      onClick={onSelect}
      onMouseEnter={(e) => onPeek(e.currentTarget)}
      onFocus={(e) => onPeek(e.currentTarget)}
      onBlur={onUnpeek}
      onKeyDown={(e) => {
        if (e.key === "Escape") onUnpeek();
      }}
      aria-label={`${hourLabel(h.hour)}: WBGT ${h.wbgtC} degrees, ${STATUS_LABEL[h.status]}`}
      className={cn(
        "flex h-auto flex-col items-stretch gap-1 rounded-xl px-0.5 py-1.5 text-[11px] font-medium",
        inShift ? "bg-deep" : "opacity-55"
      )}
    >
      <span className="text-center text-[11px] leading-none text-muted-foreground">{hourLabel(h.hour).slice(0, 2)}</span>
      <span className="text-center font-display text-sm font-semibold">{Math.round(h.wbgtC)}°</span>
      <span className={cn("flex h-9 items-center justify-center rounded-lg text-background", STATUS_FILL[h.status])}>
        {h.workMin}/{60 - h.workMin}
      </span>
      {showNew && (
        <span className={cn("flex h-6 items-center justify-center rounded-lg text-background", STATUS_FILL[h.newStatus])}>
          {h.newWorkMin}
        </span>
      )}
    </Button>
  );
}

/**
 * Hover and focus breakdown for one hour: every number is a field of the engine's HourPlan
 * (computeHeat then planDay in lib/heat.ts), never typed in. Opens on pointer hover or keyboard
 * focus, closes on leave, blur or Escape; the focused column points at it with aria-describedby.
 */
function HourBreakdown({ h, left, newCount }: { h: HourPlan; left: number; newCount: number }) {
  const rows: [string, string][] = [
    ["Air temperature", `${h.tempC}°C`],
    ["Humidity", `${Math.round(h.rh)}%`],
    ["Sunlight", `${Math.round(h.solarWm2)} W/m²`],
    ["Wind at 2 m", `${h.wind2m.toFixed(1)} m/s`],
    ["Heat index", `${h.heatIndexC}°C, ${h.hiBand.toLowerCase()}`],
    ["Sun WBGT", `${h.wbgtC}°C`],
    ["Veterans", `work ${h.workMin}, rest ${60 - h.workMin} min`],
  ];
  if (newCount > 0) rows.push(["New workers", `work ${h.newWorkMin}, rest ${60 - h.newWorkMin} min`]);
  return (
    <Card
      tone="deep"
      id={BREAKDOWN_ID}
      role="tooltip"
      className="pointer-events-none absolute bottom-full z-20 mb-2 w-68 -translate-x-1/2 space-y-2 p-4 text-sm"
      style={{ left }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-base font-semibold">{hourLabel(h.hour)}</p>
        <Badge variant={h.status === "work" ? "ok" : h.status === "pace" ? "warn" : "bad"}>{STATUS_LABEL[h.status]}</Badge>
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function HourDetail({ h, newCount }: { h: HourPlan; newCount: number }) {
  return (
    <div className="grid gap-4 rounded-xl border border-line bg-deep p-4 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-1">
        <p className="font-display text-lg font-semibold">{hourLabel(h.hour)}</p>
        <p>
          Veterans work {h.workMin} and rest {60 - h.workMin} minutes ({STATUS_LABEL[h.status].toLowerCase()}).
          {newCount > 0 && ` New workers work ${h.newWorkMin} and rest ${60 - h.newWorkMin}.`}
        </p>
        <p className="text-muted-foreground">
          Sun WBGT {h.wbgtC}°C{h.effectiveC !== h.wbgtC && ` (${h.effectiveC}°C with clothing)`}. Heat index {h.heatIndexC}°C,{" "}
          {h.hiBand.toLowerCase()}.
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
        <li>Air {h.tempC}°C</li>
        <li>Humidity {Math.round(h.rh)}%</li>
        <li className="flex items-center gap-1">
          <CloudSun className="size-3.5" aria-hidden /> Sun {Math.round(h.solarWm2)} W/m²
        </li>
        <li className="flex items-center gap-1">
          <Wind className="size-3.5" aria-hidden /> Wind {h.wind2m.toFixed(1)} m/s at 2 m
        </li>
        <li>Globe {h.globeC}°C</li>
        <li>Natural wet bulb {h.wetBulbC}°C</li>
      </ul>
    </div>
  );
}

function SourceBadge({ load }: { load: LoadState }) {
  if (load.kind === "loading") return <Badge variant="outline">Loading hours…</Badge>;
  if (load.kind === "saved") return <Badge variant="secondary">Hours saved with this site</Badge>;
  if (load.kind === "live" && load.source === "seed")
    return <Badge variant="secondary">Source: seed day profile</Badge>;
  if (load.kind === "live")
    return <Badge variant="ok">{load.source === "archive" ? "Open-Meteo historical archive" : "Open-Meteo forecast"}</Badge>;
  return (
    <Badge variant="warn" title={load.error.hint}>
      {offlineLabel(load.error)}
    </Badge>
  );
}

/** Badge text for a failed refresh, chosen by error code, never by message text. */
function offlineLabel(error: ApiError): string {
  switch (error.error) {
    case "upstream_timeout":
      return "Weather timed out: stored day profile";
    case "invalid_input":
      return "Request rejected: stored day profile";
    case "parse_failure":
      return "Weather unreadable: stored day profile";
    case "upstream_error":
    case "not_configured":
    default:
      return "Offline: stored day profile";
  }
}

const SAMPLE_SENTENCE = "Sample data: these hours come from a stored day profile, not a live weather feed.";

/**
 * One plain sentence saying what the hour strip is built from, picked from the deploy's adapter
 * mode and the source of the hours on screen. A real-mode fallback to seed reads as sample data.
 */
function DataStatement({ load, mode }: { load: LoadState; mode?: DataMode }) {
  let text: string;
  if (load.kind === "loading") {
    text = "Checking where this site's hours come from.";
  } else if (load.kind === "saved") {
    text = "Saved data: these hours were stored in this browser when the site was created. The note above names their source.";
  } else if (load.kind === "live" && load.source !== "seed") {
    text = `Live data: hours from the Open-Meteo ${
      load.source === "archive" ? "historical archive" : "forecast"
    }, solved to WBGT in this site's engine.`;
  } else if (mode === "real") {
    text = `${SAMPLE_SENTENCE} The live Open-Meteo request did not come back, so this is the fallback.`;
  } else if (load.kind === "offline") {
    text = `${SAMPLE_SENTENCE} ${load.error.hint}`;
  } else {
    text = `${SAMPLE_SENTENCE} This deploy runs in sample mode.`;
  }
  return <p className="max-w-[70ch] text-sm text-muted-foreground">{text}</p>;
}

function SettingGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5" role="group" aria-label={label}>
      <p className="text-sm font-semibold">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

/** Counter that rolls to its new value with Motion; jumps straight there under reduced motion. */
function RollingNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const current = useRef(value);
  useEffect(() => {
    if (reduce) {
      current.current = value;
      setShown(value);
      return;
    }
    const controls = animate(current.current, value, {
      duration: 0.7,
      ease: "easeOut",
      onUpdate: (v) => {
        current.current = v;
        setShown(v);
      },
    });
    return () => controls.stop();
  }, [value, reduce]);
  return (
    <span className="tabular-nums">
      {shown.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}

function clampInt(raw: string, min: number, max: number): number {
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

/** Detail for a site created on /new: it lives in this browser (lib/site-store.ts). */
export function StoredSitePlan({ slug }: { slug: string }) {
  const [state, setState] = useState<
    { kind: "loading" } | { kind: "found"; site: Site; overrides: PlanOverrides } | { kind: "missing" }
  >({ kind: "loading" });
  useEffect(() => {
    const site = findLocalSite(slug);
    // This branch renders only in the browser, so the URL settings are read from window.location.
    const overrides = parsePlanParams(new URLSearchParams(window.location.search));
    setState(site ? { kind: "found", site, overrides } : { kind: "missing" });
  }, [slug]);

  if (state.kind === "loading") return <PageSkeleton label="Opening the site saved in this browser" />;
  if (state.kind === "missing")
    return (
      <EmptyState
        title="Site not found"
        body="Sites you create are saved in the browser that created them. This one is not here, so it may have been made on another device or cleared by a demo reset."
        href="/new"
        cta="Plan a new site"
      />
    );
  return <PlanView site={state.site} initialHours={state.site.snapshot ?? []} overrides={state.overrides} />;
}
