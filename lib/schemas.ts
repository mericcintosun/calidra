// zod schemas for both sides of the boundary: query strings coming in to /api/hours and
// /api/places, and Open-Meteo payloads coming back. Exported for tests/schemas.test.ts.

import { z } from "zod";
import {
  EARLIEST_DATE,
  FORECAST_HORIZON_DAYS,
  PLACE_QUERY_MAX,
  PLACE_QUERY_MIN,
  SLUG_PATTERN,
} from "./config";

/** Query params arrive as string or null; treat empty and null as absent. */
const absentToUndefined = (v: unknown) => (v === null || v === "" ? undefined : v);

const coordinate = (min: number, max: number) =>
  z.preprocess(absentToUndefined, z.coerce.number().finite().min(min).max(max).optional());

/** True when "YYYY-MM-DD" names a real calendar day (no 2023-02-30). */
function isRealDay(s: string): boolean {
  const t = Date.parse(`${s}T00:00:00Z`);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === s;
}

/** Latest allowed day: today (UTC) plus the forecast horizon, plus one day for zones ahead of UTC. */
function latestDay(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + FORECAST_HORIZON_DAYS + 1);
  return d.toISOString().slice(0, 10);
}

export const dateParamSchema = z.union([
  z.literal("tomorrow"),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
    .refine(isRealDay, "date must be a real calendar day")
    .refine((s) => s >= EARLIEST_DATE && s <= latestDay(), "date must be between 1950-01-01 and 15 days ahead"),
]);

export const hoursQuerySchema = z
  .object({
    slug: z.preprocess(absentToUndefined, z.string().regex(SLUG_PATTERN).optional()),
    lat: coordinate(-90, 90),
    lon: coordinate(-180, 180),
    date: z.preprocess(absentToUndefined, dateParamSchema.optional()),
  })
  .refine((q) => q.slug !== undefined || (q.lat !== undefined && q.lon !== undefined), {
    message: "pass slug, or lat and lon",
  });

export type HoursQuery = z.infer<typeof hoursQuerySchema>;

/** /api/sites/[slug]: the path segment must look like a site slug before any lookup. */
export const siteSlugSchema = z.string().regex(SLUG_PATTERN);

export const placesQuerySchema = z.object({
  q: z.string().trim().min(PLACE_QUERY_MIN).max(PLACE_QUERY_MAX),
});

export type PlacesQuery = z.infer<typeof placesQuerySchema>;

/* ---------- upstream payloads ---------- */

const nullableNumbers = z.array(z.number().nullable());

export const openMeteoHourlySchema = z.object({
  utc_offset_seconds: z.number(),
  timezone: z.string(),
  hourly: z.object({
    time: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)),
    temperature_2m: nullableNumbers,
    relative_humidity_2m: nullableNumbers,
    shortwave_radiation: nullableNumbers,
    wind_speed_10m: nullableNumbers,
    cloud_cover: nullableNumbers,
    surface_pressure: nullableNumbers,
  }),
});

export type OpenMeteoHourly = z.infer<typeof openMeteoHourlySchema>;

export const openMeteoGeocodeSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        admin1: z.string().optional(),
        country: z.string().optional(),
        latitude: z.number(),
        longitude: z.number(),
        timezone: z.string().optional(),
        elevation: z.number().optional(),
      })
    )
    .optional(),
});

export type OpenMeteoGeocode = z.infer<typeof openMeteoGeocodeSchema>;
