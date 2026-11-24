// Fake adapter: everything comes from the seed module, no network. This is the default
// (ADAPTER_MODE unset or "fake") so the first deploy renders with no outside dependency.

import type { CalidraAdapter, HoursInput } from "../adapter";
import { findSeedSite, sites } from "../data/seed";
import { resolveDate, seedHours } from "../open-meteo";
import type { HourlyResult, Place, Site } from "../types";

/** IANA time zones for the seed cities, keyed by site slug. */
const SEED_TIMEZONES: Record<string, string> = {
  "phoenix-desert-ridge-framing": "America/Phoenix",
  "houston-westchase-reroof": "America/Chicago",
  "kerman-grape-thinning": "America/Los_Angeles",
  "carmona-solar-install": "Europe/Madrid",
  "delhi-dwarka-rebar": "Asia/Kolkata",
  "ceyhan-cotton-irrigation": "Europe/Istanbul",
  "coral-gables-grounds": "America/New_York",
  "cuiaba-soy-field-crew": "America/Cuiaba",
  "perth-kwinana-resurfacing": "Australia/Perth",
  "lujan-de-cuyo-drip-checks": "America/Argentina/Mendoza",
};

/** The offline place list for /new: one entry per seed city, with fixed ids. */
const SEED_PLACES: Place[] = sites.map((s, i) => ({
  id: 9000001 + i,
  name: s.city,
  admin1: s.region,
  country: s.country,
  latitude: s.lat,
  longitude: s.lon,
  timezone: SEED_TIMEZONES[s.slug] ?? "auto",
}));

function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** The seed site closest to a point; its day profile stands in for places with no seed. */
function nearestSeed(lat: number, lon: number): Site {
  let best = sites[0];
  let bestD = Infinity;
  for (const s of sites) {
    const d = (s.lat - lat) ** 2 + (s.lon - lon) ** 2;
    if (d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best;
}

async function getHours(site: HoursInput, date: string): Promise<HourlyResult> {
  const base = nearestSeed(site.lat, site.lon);
  const hasOwn = Boolean(site.profile || (site.snapshot && site.snapshot.length > 0));
  const profileDate = hasOwn && site.profileDate ? site.profileDate : date ? resolveDate(date) : base.profileDate;
  const full: Site = {
    ...base,
    ...site,
    profile: site.profile ?? base.profile,
    snapshot: site.snapshot,
    profileDate,
  };
  return {
    hours: seedHours(full),
    source: "seed",
    date: profileDate,
    timezone: (site.slug && SEED_TIMEZONES[site.slug]) || "auto",
  };
}

export const fakeAdapter: CalidraAdapter = {
  mode: "fake",
  async listSites() {
    return sites;
  },
  async getSite(slug: string) {
    return findSeedSite(slug);
  },
  getHours,
  async searchPlaces(q: string) {
    const needle = fold(q.trim());
    if (needle.length < 2) return [];
    return SEED_PLACES.filter((p) =>
      [p.name, p.admin1 ?? "", p.country].some((field) => fold(field).includes(needle))
    ).slice(0, 6);
  },
};
