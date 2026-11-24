// Open-Meteo clients, server only. All three APIs are keyless; their URLs live in lib/config.ts.
// lib/adapters/real.ts calls them behind /api/hours and /api/places when ADAPTER_MODE=real.
// Every request goes through fetchJson() (timeout, one retry) and every answer through a zod
// schema; a schema miss is a parse_failure. seedHours() is the offline path: it expands a site's
// stored daily profile into 24 hours. Client components import date helpers from lib/heat.ts,
// never from this file.

import {
  ARCHIVE_LAG_DAYS,
  ARCHIVE_REVALIDATE_S,
  FORECAST_REVALIDATE_S,
  GEOCODING_REVALIDATE_S,
  LOG_PREFIX,
  MIN_COMPLETE_HOURS,
  OPEN_METEO_ARCHIVE_URL,
  OPEN_METEO_FORECAST_URL,
  OPEN_METEO_GEOCODING_URL,
  OPEN_METEO_HOURLY_VARS,
  PLACE_RESULT_COUNT,
} from "./config";
import { CalidraError } from "./errors";
import { cosZenith, resolveDate } from "./heat";
import { fetchJson } from "./http";
import { openMeteoGeocodeSchema, openMeteoHourlySchema } from "./schemas";
import type { HourlyResult, HourlyWeather, Place, Site, WeatherSource } from "./types";

export type { HourlyResult, Place, WeatherSource } from "./types";
export { isoDate, resolveDate } from "./heat";

/** The archive lags real time by about five days; anything newer goes to the forecast API. */
export function pickEndpoint(date: string): Exclude<WeatherSource, "seed"> {
  const days = (Date.parse(`${date}T12:00:00Z`) - Date.now()) / 86400000;
  return days < -ARCHIVE_LAG_DAYS ? "archive" : "forecast";
}

export async function fetchHourly(lat: number, lon: number, dateIn: string): Promise<HourlyResult> {
  const date = resolveDate(dateIn);
  const source = pickEndpoint(date);
  const base = source === "archive" ? OPEN_METEO_ARCHIVE_URL : OPEN_METEO_FORECAST_URL;
  const url =
    `${base}?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
    `&start_date=${date}&end_date=${date}&hourly=${OPEN_METEO_HOURLY_VARS}&wind_speed_unit=ms&timezone=auto`;

  const raw = await fetchJson(url, {
    revalidate: source === "archive" ? ARCHIVE_REVALIDATE_S : FORECAST_REVALIDATE_S,
  });
  const parsed = openMeteoHourlySchema.safeParse(raw);
  if (!parsed.success) {
    console.warn(`${LOG_PREFIX} hours parse fail source=${source} issues=${parsed.error.issues.length}`);
    throw new CalidraError("parse_failure", "hourly payload did not match the schema");
  }

  const json = parsed.data;
  const h = json.hourly;
  const hours: HourlyWeather[] = [];
  for (let i = 0; i < h.time.length; i++) {
    const temp = h.temperature_2m[i];
    const rh = h.relative_humidity_2m[i];
    if (temp == null || rh == null) continue;
    const [d, t] = h.time[i].split("T");
    const [y, m, day] = d.split("-").map(Number);
    const hour = Number(t.slice(0, 2));
    hours.push({
      local: h.time[i],
      hour,
      utcMs: Date.UTC(y, m - 1, day, hour) - json.utc_offset_seconds * 1000,
      tempC: temp,
      rh,
      solarWm2: h.shortwave_radiation[i] ?? 0,
      windMs: h.wind_speed_10m[i] ?? 1,
      cloudPct: h.cloud_cover[i] ?? 0,
      pressureHpa: h.surface_pressure[i] ?? 1013.25,
    });
  }
  if (hours.length < MIN_COMPLETE_HOURS) {
    console.warn(`${LOG_PREFIX} hours too few source=${source} complete=${hours.length}`);
    throw new CalidraError("parse_failure", "too few complete hours");
  }
  console.info(`${LOG_PREFIX} hours ok source=${source} complete=${hours.length}`);
  return { hours, source, date, timezone: json.timezone };
}

export async function searchPlaces(name: string): Promise<Place[]> {
  const url =
    `${OPEN_METEO_GEOCODING_URL}?name=${encodeURIComponent(name)}` +
    `&count=${PLACE_RESULT_COUNT}&language=en&format=json`;
  const raw = await fetchJson(url, { revalidate: GEOCODING_REVALIDATE_S });
  const parsed = openMeteoGeocodeSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn(`${LOG_PREFIX} places parse fail issues=${parsed.error.issues.length}`);
    throw new CalidraError("parse_failure", "geocoding payload did not match the schema");
  }
  const places: Place[] = (parsed.data.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    admin1: r.admin1,
    country: r.country ?? "",
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone ?? "auto",
    elevation: r.elevation,
  }));
  console.info(`${LOG_PREFIX} places ok qlen=${name.length} results=${places.length}`);
  return places;
}

/* ---------- offline seed profile ---------- */

/** 0 at 06:00 (daily minimum), 1 at 15:00 (daily maximum). */
function dayShape(h: number): number {
  if (h >= 6 && h <= 15) return 0.5 - 0.5 * Math.cos((Math.PI * (h - 6)) / 9);
  const since = h > 15 ? h - 15 : h + 9;
  return 0.5 + 0.5 * Math.cos((Math.PI * since) / 15);
}

/** 24 hours drawn from the site's stored profile, or its saved Open-Meteo snapshot. */
export function seedHours(site: Site): HourlyWeather[] {
  if (site.snapshot && site.snapshot.length > 0) return site.snapshot;
  const p = site.profile;
  if (!p) return [];
  const [y, m, d] = site.profileDate.split("-").map(Number);
  const offsetMs = site.utcOffsetHours * 3600000;
  const utcAt = (hour: number) => Date.UTC(y, m - 1, d, hour) - offsetMs;
  const cos = Array.from({ length: 24 }, (_, h) => cosZenith(utcAt(h) - 1800000, site.lat, site.lon));
  const maxCos = Math.max(...cos, 0.01);
  return cos.map((cz, hour) => {
    const s = dayShape(hour);
    return {
      local: `${site.profileDate}T${String(hour).padStart(2, "0")}:00`,
      hour,
      utcMs: utcAt(hour),
      tempC: Math.round((p.tMinC + (p.tMaxC - p.tMinC) * s) * 10) / 10,
      rh: Math.round(p.rhAtMin + (p.rhAtMax - p.rhAtMin) * s),
      solarWm2: cz > 0 ? Math.round(p.peakSolarWm2 * Math.pow(cz / maxCos, 1.2)) : 0,
      windMs: Math.round(p.windMs * (0.7 + 0.5 * s) * 10) / 10,
      cloudPct: p.cloudPct,
      pressureHpa: 1013.25,
    };
  });
}
