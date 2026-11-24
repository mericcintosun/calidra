// Sites created on /new live in this browser's localStorage, with their Open-Meteo hours saved
// as a snapshot. This file is the only place in the app that touches localStorage.
//
// Documented limit: the list is per browser. A plan saved on the lead's phone does not show on
// the foreman's laptop, and clearing site data (or opening /?demo-reset=1) removes it. The demo
// only reads a site back in the browser that made it, so no server store exists.
//
// Duplicate safety: the slug ends in siteKey(), a hash of the inputs that define a site. The
// same inputs give the same slug, and saveLocalSite() replaces a record with that slug instead
// of adding a second row. There is no server write route, so this is the whole idempotency check.

import { z } from "zod";
import type { Site } from "./types";

const KEY = "calidra.sites.v1";
const MAX_SITES = 30;

const hourlyWeatherSchema = z.object({
  local: z.string(),
  hour: z.number(),
  utcMs: z.number(),
  tempC: z.number(),
  rh: z.number(),
  solarWm2: z.number(),
  windMs: z.number(),
  cloudPct: z.number(),
  pressureHpa: z.number(),
});

const dayProfileSchema = z.object({
  tMinC: z.number(),
  tMaxC: z.number(),
  rhAtMin: z.number(),
  rhAtMax: z.number(),
  peakSolarWm2: z.number(),
  windMs: z.number(),
  cloudPct: z.number(),
});

/** One stored site, checked field by field against the Site type in lib/types.ts. */
export const storedSiteSchema = z.object({
  slug: z.string().min(1),
  name: z.string(),
  trade: z.string(),
  city: z.string(),
  region: z.string(),
  country: z.string(),
  lat: z.number(),
  lon: z.number(),
  utcOffsetHours: z.number(),
  date: z.string(),
  profileDate: z.string(),
  mode: z.enum(["archive", "forecast"]),
  note: z.string(),
  profile: dayProfileSchema.optional(),
  snapshot: z.array(hourlyWeatherSchema).optional(),
  createdLocally: z.boolean().optional(),
  workload: z.enum(["light", "moderate", "heavy", "veryHeavy"]),
  clothing: z.enum(["workClothes", "polyolefin", "doubleLayer", "vaporBarrier"]),
  crewSize: z.number(),
  newWorkers: z.number(),
  newWorkerDay: z.number(),
  shiftStart: z.number(),
  shiftHours: z.number(),
});

/** Parse the raw localStorage value. Drops every entry that is not a valid Site; never throws. */
export function parseStoredSites(raw: string | null): Site[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const out: Site[] = [];
  for (const entry of data) {
    const parsed = storedSiteSchema.safeParse(entry);
    if (parsed.success) out.push(parsed.data as Site);
  }
  return out;
}

/** The inputs that make two saves "the same site". */
export interface SiteKeyInput {
  name: string;
  lat: number;
  lon: number;
  date: string;
  workload: string;
  crewSize: number;
  newWorkers: number;
  shiftStart: number;
}

/** Deterministic djb2 hash of the site inputs, in base 36. Same inputs, same key. */
export function siteKey(input: SiteKeyInput): string {
  const text = [
    input.name.trim().toLowerCase(),
    input.lat.toFixed(4),
    input.lon.toFixed(4),
    input.date,
    input.workload,
    String(input.crewSize),
    String(input.newWorkers),
    String(input.shiftStart),
  ].join("|");
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

export function loadLocalSites(): Site[] {
  if (typeof window === "undefined") return [];
  try {
    return parseStoredSites(window.localStorage.getItem(KEY));
  } catch {
    // Storage blocked (some private modes): behave as an empty list.
    return [];
  }
}

export function findLocalSite(slug: string): Site | undefined {
  return loadLocalSites().find((s) => s.slug === slug);
}

export type SaveResult = { status: "created" | "duplicate" } | { status: "failed"; reason: "quota" | "unavailable" };

/**
 * Save a site at the top of the list. A record with the same slug is replaced and moved to the
 * top (status "duplicate"), so a double submit or a repeat save leaves one row. Keeps 30 sites.
 */
export function saveLocalSite(site: Site): SaveResult {
  if (typeof window === "undefined") return { status: "failed", reason: "unavailable" };
  let existing: Site[];
  try {
    existing = parseStoredSites(window.localStorage.getItem(KEY));
  } catch {
    return { status: "failed", reason: "unavailable" };
  }
  const duplicate = existing.some((s) => s.slug === site.slug);
  const rest = existing.filter((s) => s.slug !== site.slug);
  try {
    window.localStorage.setItem(KEY, JSON.stringify([site, ...rest].slice(0, MAX_SITES)));
  } catch (e) {
    // DOMException is not an Error subclass in every browser, so read the name directly.
    const name = typeof e === "object" && e !== null && "name" in e ? String((e as { name: unknown }).name) : "";
    const quota = name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED";
    return { status: "failed", reason: quota ? "quota" : "unavailable" };
  }
  return { status: duplicate ? "duplicate" : "created" };
}

/** Window event fired after the saved list changes, so mounted lists can reload it. */
export const SITES_CHANGED_EVENT = "calidra:sites-changed";

/** Remove every site saved in this browser (used by the demo reset). Never throws. */
export function clearLocalSites(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // nothing stored, or storage blocked: already the demo start state
  }
  window.dispatchEvent(new Event(SITES_CHANGED_EVENT));
}

/** URL slug: the readable name plus the siteKey hash, so the same inputs give the same slug. */
export function slugify(text: string, key: string): string {
  const base = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "site"}-${key}`;
}
