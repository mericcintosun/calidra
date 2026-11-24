// Public entry for Calidra data. Types live in lib/types.ts, the 10 seed sites in
// lib/data/seed.ts; this file re-exports both and keeps the URL filter parser.

import type { CollectionFilters, Workload } from "./types";

export * from "./types";
export { sites, findSeedSite } from "./data/seed";

const WORK_KEYS: Workload[] = ["light", "moderate", "heavy", "veryHeavy"];

export function parseFilters(sp: Record<string, string | string[] | undefined>): CollectionFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const work = one(sp.work);
  const mode = one(sp.mode);
  const sort = one(sp.sort);
  return {
    q: one(sp.q).slice(0, 60),
    work: (WORK_KEYS as string[]).includes(work) ? (work as Workload) : "all",
    mode: mode === "archive" || mode === "forecast" ? mode : "all",
    sort: sort === "stops" || sort === "rest" || sort === "name" ? sort : "peak",
  };
}
