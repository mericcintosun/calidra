// Plan settings held in the URL. Pure and client-safe: no server config, no fetch.
//
//   /site/phoenix-desert-ridge-framing?workload=heavy&clothing=workClothes&crew=6&newWorkers=2&day=2&start=5&hours=8
//
// parsePlanParams() reads whatever is in the query and keeps only valid values; anything
// missing or invalid is left out, so applyPlanParams() falls back to the site's own defaults.
// Nothing here throws.

import { z } from "zod";
import { CLOTHING_KEYS, EARLIEST_START, WORKLOAD_KEYS } from "./heat";
import type { Clothing, PlanSettings, Workload } from "./types";

/** Shift lengths the settings panel offers. */
export const SHIFT_LENGTHS = [6, 8, 10] as const;

const intIn = (min: number, max: number) => z.coerce.number().int().min(min).max(max);

/** One schema per query key. Each key is checked on its own so one bad value never drops the rest. */
export const planParamsSchema = z
  .object({
    workload: z.enum(WORKLOAD_KEYS as [Workload, ...Workload[]]),
    clothing: z.enum(CLOTHING_KEYS as [Clothing, ...Clothing[]]),
    crew: intIn(1, 60),
    newWorkers: intIn(0, 60),
    day: intIn(1, 5),
    start: intIn(0, 23),
    hours: z.coerce
      .number()
      .int()
      .refine((n) => (SHIFT_LENGTHS as readonly number[]).includes(n)),
  })
  .partial();

export type PlanParams = z.infer<typeof planParamsSchema>;

/** Settings found in the URL; only the keys that were present and valid. */
export type PlanOverrides = Partial<PlanSettings>;

type QueryInput = URLSearchParams | Record<string, string | string[] | undefined>;

function read(sp: QueryInput, key: string): string | undefined {
  if (sp instanceof URLSearchParams) return sp.get(key) ?? undefined;
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

function pick<S extends z.ZodTypeAny>(schema: S, raw: string | undefined): z.infer<S> | undefined {
  if (raw === undefined || raw.trim() === "") return undefined;
  const r = schema.safeParse(raw.trim());
  return r.success ? r.data : undefined;
}

/** Valid plan settings from a query string (server searchParams or URLSearchParams). Never throws. */
export function parsePlanParams(sp: QueryInput | null | undefined): PlanOverrides {
  if (!sp) return {};
  const s = planParamsSchema.shape;
  const out: PlanOverrides = {};
  const workload = pick(s.workload, read(sp, "workload"));
  const clothing = pick(s.clothing, read(sp, "clothing"));
  const crew = pick(s.crew, read(sp, "crew"));
  const newWorkers = pick(s.newWorkers, read(sp, "newWorkers"));
  const day = pick(s.day, read(sp, "day"));
  const start = pick(s.start, read(sp, "start"));
  const hours = pick(s.hours, read(sp, "hours"));
  if (workload !== undefined) out.workload = workload;
  if (clothing !== undefined) out.clothing = clothing;
  if (crew !== undefined) out.crewSize = crew;
  if (newWorkers !== undefined) out.newWorkers = newWorkers;
  if (day !== undefined) out.newWorkerDay = day;
  if (start !== undefined) out.shiftStart = start;
  if (hours !== undefined) out.shiftHours = hours;
  return out;
}

/**
 * The site's own settings with the URL values laid over them. Cross-field rules: new workers
 * never exceed the crew, and the shift start must fit the slider range (04:00 to 24 minus the
 * shift length); a start outside it falls back to the site's start.
 */
export function applyPlanParams(defaults: PlanSettings, o: PlanOverrides = {}): PlanSettings {
  const shiftHours = o.shiftHours ?? defaults.shiftHours;
  const crewSize = o.crewSize ?? defaults.crewSize;
  const maxStart = 24 - shiftHours;
  const fits = (h: number | undefined) => h !== undefined && h >= EARLIEST_START && h <= maxStart;
  const shiftStart = fits(o.shiftStart) ? (o.shiftStart as number) : Math.min(defaults.shiftStart, maxStart);
  return {
    workload: o.workload ?? defaults.workload,
    clothing: o.clothing ?? defaults.clothing,
    crewSize,
    newWorkers: Math.min(o.newWorkers ?? defaults.newWorkers, crewSize),
    newWorkerDay: o.newWorkerDay ?? defaults.newWorkerDay,
    shiftStart,
    shiftHours,
  };
}

/** The query string (no leading "?") that holds these settings, in a fixed key order. */
export function toPlanQuery(s: PlanSettings): string {
  const qs = new URLSearchParams();
  qs.set("workload", s.workload);
  qs.set("clothing", s.clothing);
  qs.set("crew", String(s.crewSize));
  qs.set("newWorkers", String(s.newWorkers));
  qs.set("day", String(s.newWorkerDay));
  qs.set("start", String(s.shiftStart));
  qs.set("hours", String(s.shiftHours));
  return qs.toString();
}
