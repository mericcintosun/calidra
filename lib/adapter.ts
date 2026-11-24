// The data seam. Pages and /api/* handlers ask getAdapter() for sites, hours and places and
// never call Open-Meteo or the seed expansion directly. This is the only module that branches
// on the mode, which comes from adapterMode() in lib/config.ts:
//   fake (default): seed sites, seed day profiles, a small offline place list.
//   real: seed sites, live Open-Meteo hours and geocoding, seed fallback when hours fail.

import { fakeAdapter } from "./adapters/fake";
import { realAdapter } from "./adapters/real";
import { adapterMode } from "./config";
import type { HourlyResult, Place, Site } from "./types";

/** Enough of a site to fetch its hours. Pass a whole Site when its seed profile should be used. */
export type HoursInput = Pick<Site, "lat" | "lon" | "utcOffsetHours"> & Partial<Site>;

export interface CalidraAdapter {
  readonly mode: "fake" | "real";
  listSites(): Promise<Site[]>;
  getSite(slug: string): Promise<Site | undefined>;
  getHours(site: HoursInput, date: string): Promise<HourlyResult>;
  searchPlaces(q: string): Promise<Place[]>;
}

export function getAdapter(): CalidraAdapter {
  return adapterMode() === "real" ? realAdapter : fakeAdapter;
}
