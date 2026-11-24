// Sites created on /new live in this browser's localStorage, with their real Open-Meteo hours
// saved as a snapshot. TODO: swap for a shared store (for example a Vercel KV or Postgres table)
// when crews need to see a plan their lead saved on another device.

import type { Site } from "./data";

const KEY = "calidra.sites.v1";

export function loadLocalSites(): Site[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Site[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function findLocalSite(slug: string): Site | undefined {
  return loadLocalSites().find((s) => s.slug === slug);
}

export function saveLocalSite(site: Site): void {
  const rest = loadLocalSites().filter((s) => s.slug !== site.slug);
  window.localStorage.setItem(KEY, JSON.stringify([site, ...rest].slice(0, 30)));
}

export function slugify(text: string): string {
  const base = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "site"}-${Date.now().toString(36).slice(-4)}`;
}
