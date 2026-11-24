// Shared types for Calidra. lib/data.ts and lib/open-meteo.ts re-export these so older
// import paths keep working.

import type { ApiError } from "./errors";

export type { ApiError, ErrorCode } from "./errors";

export type Workload = "light" | "moderate" | "heavy" | "veryHeavy";
export type Clothing = "workClothes" | "polyolefin" | "doubleLayer" | "vaporBarrier";
export type SiteMode = "archive" | "forecast";

/** One hour of weather, in the units the WBGT engine expects. */
export interface HourlyWeather {
  /** Local wall-clock time at the site, "2023-07-19T13:00". */
  local: string;
  hour: number;
  /** UTC instant of the END of the hour (Open-Meteo radiation is a preceding-hour mean). */
  utcMs: number;
  tempC: number;
  /** Relative humidity in percent. */
  rh: number;
  /** Global horizontal shortwave radiation, W/m2. */
  solarWm2: number;
  /** Wind speed at 10 m, m/s. */
  windMs: number;
  cloudPct: number;
  pressureHpa: number;
}

/** A daily shape that seedHours() expands into 24 plausible hours. */
export interface DayProfile {
  tMinC: number;
  tMaxC: number;
  rhAtMin: number;
  rhAtMax: number;
  peakSolarWm2: number;
  windMs: number;
  cloudPct: number;
}

export interface PlanSettings {
  workload: Workload;
  clothing: Clothing;
  crewSize: number;
  newWorkers: number;
  /** Day on the job for the new workers, 1 to 5 (NIOSH 20 percent per day ramp). */
  newWorkerDay: number;
  shiftStart: number;
  shiftHours: number;
}

export interface Site extends PlanSettings {
  slug: string;
  name: string;
  trade: string;
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  utcOffsetHours: number;
  /** "YYYY-MM-DD", or "tomorrow" for live forecast sites. */
  date: string;
  /** Date used to place the sun when drawing the seed profile. */
  profileDate: string;
  mode: SiteMode;
  note: string;
  profile?: DayProfile;
  /** Real Open-Meteo hours saved when a site is created from /new. */
  snapshot?: HourlyWeather[];
  createdLocally?: boolean;
}

/** Collection filters. They live in the URL: /?q=phoenix&work=heavy&mode=archive&sort=peak */
export type SortKey = "peak" | "rest" | "name";
export interface CollectionFilters {
  q: string;
  work: Workload | "all";
  mode: SiteMode | "all";
  sort: SortKey;
}

/** Where a set of hours came from. "seed" is the stored day profile expanded offline. */
export type WeatherSource = "archive" | "forecast" | "seed";

export interface HourlyResult {
  hours: HourlyWeather[];
  source: WeatherSource;
  date: string;
  timezone: string;
}

export interface Place {
  id: number;
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  elevation?: number;
}

/** The one JSON shape every /api/* handler returns. `error` is a code plus a fixed hint. */
export interface ApiResponse<T> {
  ok: boolean;
  data: T | null;
  error: ApiError | null;
  source: "seed" | "forecast" | "archive";
}
