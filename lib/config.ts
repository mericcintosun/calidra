// The one home for Calidra's runtime constants: endpoints, timeouts, retries, cache windows,
// query limits and the adapter mode. Server only; client components never import this file.

/** The three keyless Open-Meteo APIs. */
export const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
export const OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";
export const OPEN_METEO_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

/** Hourly variables requested from the forecast and archive APIs. */
export const OPEN_METEO_HOURLY_VARS =
  "temperature_2m,relative_humidity_2m,shortwave_radiation,wind_speed_10m,cloud_cover,surface_pressure";

/** Per attempt. Every outbound call goes through lib/http.ts, which applies these. */
export const HTTP_TIMEOUT_MS = 8000;
/** Extra attempts after the first one, for timeouts, network errors and 5xx answers only. */
export const HTTP_RETRIES = 1;

/**
 * Most time a page waits for live hours before it serves the seed fallback. Every demo step
 * must render in under 5 s, so this leaves about 1 s for the engine and the render. Slower
 * upstream answers still land in the cache for the next visit.
 */
export const HOURS_BUDGET_MS = 4000;

/** Next.js data cache windows, in seconds. */
export const FORECAST_REVALIDATE_S = 1800;
export const ARCHIVE_REVALIDATE_S = 86400;
export const GEOCODING_REVALIDATE_S = 86400;

/** Dates older than this many days go to the archive API; anything newer to the forecast. */
export const ARCHIVE_LAG_DAYS = 6;

/** Prefix on every server log line from the weather path. */
export const LOG_PREFIX = "[core]";

/* ---------- query limits (used by lib/schemas.ts) ---------- */
export const SLUG_PATTERN = /^[a-z0-9-]{1,80}$/;
export const EARLIEST_DATE = "1950-01-01";
/** Open-Meteo forecasts 16 days; Calidra offers today plus 15. */
export const FORECAST_HORIZON_DAYS = 15;
export const PLACE_QUERY_MIN = 2;
export const PLACE_QUERY_MAX = 80;
export const PLACE_RESULT_COUNT = 6;
/** A day with fewer complete hours than this is treated as unreadable. */
export const MIN_COMPLETE_HOURS = 12;

/**
 * Public base URL of the deploy, used for metadataBase and the crew sheet QR code. Public by
 * design (it is the address people visit), so NEXT_PUBLIC_ is fine. No trailing slash.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://calidra.vercel.app").replace(/\/+$/, "");

export type AdapterMode = "fake" | "real";

let warnedIgnoredFake = false;

/**
 * Live Open-Meteo is the default: all three APIs are keyless, so a deploy with no env set still
 * serves real hours (and falls back to the seed profile per request if a call fails). An
 * explicit ADAPTER_MODE=fake selects the offline seed adapter for local development, tests and
 * preview deploys only. The production deploy (VERCEL_ENV=production, set by Vercel itself)
 * always serves live hours: an ADAPTER_MODE=fake left in the project's env from the first,
 * offline deploy used to put the public URL in sample mode, which is the bug this guards.
 */
export function adapterMode(): AdapterMode {
  const wantsFake = process.env.ADAPTER_MODE?.trim().toLowerCase() === "fake";
  if (!wantsFake) return "real";
  if (process.env.VERCEL_ENV === "production") {
    if (!warnedIgnoredFake) {
      warnedIgnoredFake = true;
      console.warn(`${LOG_PREFIX} ADAPTER_MODE=fake is ignored on the production deploy; serving live Open-Meteo hours.`);
    }
    return "real";
  }
  return "fake";
}
