// Real adapter (ADAPTER_MODE=real): seed sites, live Open-Meteo hours and geocoding.
//
// Hours are cached with unstable_cache, one entry per source, place (4 decimals) and date, for
// 24 h on archive days and 30 min on forecast days, so the 10 rows on / cost at most 10 upstream
// calls per window instead of 10 per request. Each page waits at most HOURS_BUDGET_MS for them.
// On a timeout or any error the site falls back to its seed day profile (fakeAdapter.getHours)
// and the result says source "seed", so the page labels it as sample data.

import { unstable_cache } from "next/cache";
import type { CalidraAdapter, HoursInput } from "../adapter";
import { ARCHIVE_REVALIDATE_S, FORECAST_REVALIDATE_S, HOURS_BUDGET_MS, LOG_PREFIX } from "../config";
import { codeOf } from "../errors";
import { resolveDate } from "../heat";
import { fetchHourly, pickEndpoint, searchPlaces } from "../open-meteo";
import type { HourlyResult } from "../types";
import { fakeAdapter } from "./fake";

// unstable_cache appends the call arguments (lat4, lon4, date) to these key parts.
const cachedArchiveHours = unstable_cache(
  (lat4: number, lon4: number, date: string) => fetchHourly(lat4, lon4, date),
  ["calidra-hours", "archive"],
  { revalidate: ARCHIVE_REVALIDATE_S }
);

const cachedForecastHours = unstable_cache(
  (lat4: number, lon4: number, date: string) => fetchHourly(lat4, lon4, date),
  ["calidra-hours", "forecast"],
  { revalidate: FORECAST_REVALIDATE_S }
);

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** Cached live hours. Outside a Next.js server (the proof script) there is no cache, so call directly. */
async function cachedHours(lat: number, lon: number, dateIn: string): Promise<HourlyResult> {
  const date = resolveDate(dateIn);
  const source = pickEndpoint(date);
  const lat4 = round4(lat);
  const lon4 = round4(lon);
  const cached = source === "archive" ? cachedArchiveHours : cachedForecastHours;
  try {
    return await cached(lat4, lon4, date);
  } catch (e) {
    if (e instanceof Error && e.message.includes("incrementalCache missing")) return fetchHourly(lat4, lon4, date);
    throw e;
  }
}

class BudgetExceeded extends Error {
  constructor() {
    super("hours budget exceeded");
    this.name = "BudgetExceeded";
  }
}

/** Resolve with p, or reject with BudgetExceeded after ms. */
function withinBudget<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new BudgetExceeded()), ms);
  });
  return Promise.race([p, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export const realAdapter: CalidraAdapter = {
  mode: "real",
  listSites: () => fakeAdapter.listSites(),
  getSite: (slug: string) => fakeAdapter.getSite(slug),
  async getHours(site: HoursInput, date: string): Promise<HourlyResult> {
    const live = cachedHours(site.lat, site.lon, date);
    // A late rejection after the budget fired must not surface as unhandled.
    live.catch(() => {});
    try {
      return await withinBudget(live, HOURS_BUDGET_MS);
    } catch (e) {
      if (e instanceof BudgetExceeded) {
        console.warn(`${LOG_PREFIX} real hours failed reason=budget ms=${HOURS_BUDGET_MS} falling back to seed`);
      } else {
        console.warn(`${LOG_PREFIX} real hours failed code=${codeOf(e)} falling back to seed`);
      }
      return fakeAdapter.getHours(site, date);
    }
  },
  searchPlaces: (q: string) => searchPlaces(q),
};
