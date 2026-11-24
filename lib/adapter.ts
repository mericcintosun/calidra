// The data seam. Pages and /api/* handlers ask getAdapter() for sites, hours and places and
// never call Open-Meteo or the seed expansion directly.
//   ADAPTER_MODE=fake (default): seed sites, seed day profiles, a small offline place list.
//   ADAPTER_MODE=real: seed sites, live Open-Meteo hours and geocoding, seed fallback on error.

import { fakeAdapter } from "./adapters/fake";
import { realAdapter } from "./adapters/real";
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
  return process.env.ADAPTER_MODE === "real" ? realAdapter : fakeAdapter;
}
