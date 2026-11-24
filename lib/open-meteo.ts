// Open-Meteo clients. All three APIs are keyless. lib/adapters/real.ts calls them on the
// server behind /api/hours and /api/places when ADAPTER_MODE=real:
//   Forecast   https://api.open-meteo.com/v1/forecast
//   Historical https://archive-api.open-meteo.com/v1/archive
//   Geocoding  https://geocoding-api.open-meteo.com/v1/search
// seedHours() is the offline path: it expands a site's stored daily profile into 24 hours so
// every page renders with JavaScript off or when the network fails. The UI says which one it shows.

import type { HourlyResult, HourlyWeather, Place, Site, WeatherSource } from "./types";
import { cosZenith } from "./heat";

export type { HourlyResult, Place, WeatherSource } from "./types";

const HOURLY = "temperature_2m,relative_humidity_2m,shortwave_radiation,wind_speed_10m,cloud_cover,surface_pressure";

interface OpenMeteoHourly {
  utc_offset_seconds: number;
  timezone: string;
  hourly?: {
    time: string[];
    temperature_2m: (number | null)[];
    relative_humidity_2m: (number | null)[];
    shortwave_radiation: (number | null)[];
    wind_speed_10m: (number | null)[];
    cloud_cover: (number | null)[];
    surface_pressure: (number | null)[];
  };
  reason?: string;
}

/** YYYY-MM-DD in the browser's calendar. */
export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function resolveDate(date: string): string {
  if (date !== "tomorrow") return date;
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return isoDate(d);
}

/** The archive lags real time by about five days; anything newer goes to the forecast API. */
export function pickEndpoint(date: string): Exclude<WeatherSource, "seed"> {
  const days = (Date.parse(`${date}T12:00:00Z`) - Date.now()) / 86400000;
  return days < -6 ? "archive" : "forecast";
}

export async function fetchHourly(lat: number, lon: number, dateIn: string, signal?: AbortSignal): Promise<HourlyResult> {
  const date = resolveDate(dateIn);
  const source = pickEndpoint(date);
  const base = source === "archive" ? "https://archive-api.open-meteo.com/v1/archive" : "https://api.open-meteo.com/v1/forecast";
  const url =
    `${base}?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
    `&start_date=${date}&end_date=${date}&hourly=${HOURLY}&wind_speed_unit=ms&timezone=auto`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { reason?: string };
    throw new Error(body.reason ?? `Open-Meteo ${source} answered ${res.status}`);
  }
  const json = (await res.json()) as OpenMeteoHourly;
  const h = json.hourly;
  if (!h || h.time.length === 0) throw new Error("Open-Meteo returned no hourly data for that date");
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
  if (hours.length < 12) throw new Error("Open-Meteo returned too few complete hours for that date");
  return { hours, source, date, timezone: json.timezone };
}

export async function searchPlaces(name: string, signal?: AbortSignal): Promise<Place[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=6&language=en&format=json`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Place search answered ${res.status}`);
  const json = (await res.json()) as { results?: Place[] };
  return json.results ?? [];
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
