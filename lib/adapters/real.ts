// Real adapter (ADAPTER_MODE=real): seed sites, live Open-Meteo hours and geocoding.
// If the weather call fails, the site falls back to its seed day profile and the
// result says source "seed", so the UI badge stays honest.

import type { CalidraAdapter, HoursInput } from "../adapter";
import { fetchHourly, searchPlaces } from "../open-meteo";
import type { HourlyResult } from "../types";
import { fakeAdapter } from "./fake";

export const realAdapter: CalidraAdapter = {
  mode: "real",
  listSites: () => fakeAdapter.listSites(),
  getSite: (slug: string) => fakeAdapter.getSite(slug),
  async getHours(site: HoursInput, date: string): Promise<HourlyResult> {
    try {
      return await fetchHourly(site.lat, site.lon, date);
    } catch {
      return fakeAdapter.getHours(site, date);
    }
  },
  searchPlaces: (q: string) => searchPlaces(q),
};
