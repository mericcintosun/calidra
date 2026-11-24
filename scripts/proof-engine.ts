// Live engine proof, run with `npx tsx scripts/proof-engine.ts` (scripts/proof.mjs does this).
// Part 1 (live-weather): one real Open-Meteo archive call for Phoenix on 19 Jul 2023 through
// lib/open-meteo.ts, then the heat engine, the heavy-work planner and the mismatch search.
// Part 2 (demo-path): getHours timed through getAdapter() in real mode for the two demo sites
// (Phoenix 2023-07-19 and Cuiabá "tomorrow"), with the source that came back and whether
// findBandGap found an hour. Outside a Next.js server there is no data cache, so these are
// cold timings, the worst case a visitor sees.
// Prints exactly one line that starts with PROOF_JSON followed by a JSON object; server log
// lines may come first. It never invents a number: on failure the JSON says ok=false.

import { findSeedSite } from "../lib/data/seed";
import { codeOf } from "../lib/errors";
import { computeHeat, findBandGap, findMismatch, planDay } from "../lib/heat";
import { fetchHourly } from "../lib/open-meteo";

const LAT = 33.4484;
const LON = -112.074;
const DATE = "2023-07-19";

const DEMO_SITES = ["phoenix-desert-ridge-framing", "cuiaba-soy-field-crew"] as const;

interface DemoStep {
  slug: string;
  date: string;
  ok: boolean;
  ms: number;
  source?: string;
  hours?: number;
  bandGap?: { hour: number; hiBand: string; status: string } | null;
  code?: string;
}

async function liveWeather(): Promise<Record<string, unknown>> {
  const site = findSeedSite("phoenix-desert-ridge-framing");
  const started = Date.now();
  try {
    const result = await fetchHourly(LAT, LON, DATE);
    const latencyMs = Date.now() - started;
    const settings = site ?? {
      workload: "heavy" as const,
      clothing: "workClothes" as const,
      crewSize: 6,
      newWorkers: 2,
      newWorkerDay: 2,
      shiftStart: 7,
      shiftHours: 8,
    };
    const plan = planDay(computeHeat(result.hours, LAT, LON), { ...settings, workload: "heavy" });
    const m = findMismatch(plan);
    return {
      ok: true,
      source: result.source,
      date: result.date,
      hours: result.hours.length,
      latencyMs,
      mismatch: m
        ? { hour: m.hour, heatIndexC: m.heatIndexC, hiBand: m.hiBand, wbgtC: m.wbgtC, workMin: m.workMin, status: m.status }
        : null,
    };
  } catch (e) {
    return { ok: false, code: codeOf(e), latencyMs: Date.now() - started };
  }
}

async function demoPath(): Promise<{ ok: boolean; reason?: string; steps: DemoStep[] }> {
  process.env.ADAPTER_MODE = "real";
  let getAdapter: typeof import("../lib/adapter").getAdapter;
  try {
    ({ getAdapter } = await import("../lib/adapter"));
  } catch {
    return { ok: false, reason: "the adapter module could not load outside Next.js", steps: [] };
  }
  const adapter = getAdapter();
  if (adapter.mode !== "real") return { ok: false, reason: "the real adapter was not selected", steps: [] };
  const steps: DemoStep[] = [];
  for (const slug of DEMO_SITES) {
    const site = findSeedSite(slug);
    if (!site) {
      steps.push({ slug, date: "", ok: false, ms: 0, code: "invalid_input" });
      continue;
    }
    const started = Date.now();
    try {
      const r = await adapter.getHours(site, site.date);
      const ms = Date.now() - started;
      const gap = findBandGap(planDay(computeHeat(r.hours, site.lat, site.lon), site));
      steps.push({
        slug,
        date: r.date,
        ok: true,
        ms,
        source: r.source,
        hours: r.hours.length,
        bandGap: gap ? { hour: gap.hour, hiBand: gap.hiBand, status: gap.status } : null,
      });
    } catch (e) {
      steps.push({ slug, date: site.date, ok: false, ms: Date.now() - started, code: codeOf(e) });
    }
  }
  return { ok: true, steps };
}

/**
 * Part 3 (print-sheet): the DEMO.md step 8 sheet for Phoenix (heavy, crew 6, 2 new, start 05:00)
 * built by lib/print-sheet.ts in English and Spanish. Live archive hours when the call works,
 * otherwise the seed day profile; the result says which.
 */
async function printSheet(): Promise<Record<string, unknown>> {
  try {
    const { buildSheet } = await import("../lib/print-sheet");
    const { applyPlanParams, parsePlanParams, toPlanQuery } = await import("../lib/plan-params");
    const { seedHours } = await import("../lib/open-meteo");
    const site = findSeedSite("phoenix-desert-ridge-framing");
    if (!site) return { ok: false, reason: "the Phoenix seed site is missing" };
    const settings = applyPlanParams(site, parsePlanParams(new URLSearchParams("start=5")));
    let hours = seedHours(site);
    let source: "archive" | "forecast" | "seed" = "seed";
    try {
      const live = await fetchHourly(site.lat, site.lon, site.date);
      if (live.hours.length > 0) {
        hours = live.hours;
        source = live.source;
      }
    } catch {
      // keep the seed profile; the line says so
    }
    const en = buildSheet(site, hours, settings, "en", { date: site.date, source });
    const es = buildSheet(site, hours, settings, "es", { date: site.date, source });
    return {
      ok: true,
      source,
      query: toPlanQuery(settings),
      rows: en.rows.length,
      totalRestMin: en.totalRestMin,
      first: en.rows[0] ? { hour: en.rows[0].hourLabel, en: en.rows[0].statusLabel, es: es.rows[0].statusLabel } : null,
      bestEn: en.bestLine,
      bestEs: es.bestLine,
      sameNumbers: JSON.stringify(en.rows.map((r) => r.workMin)) === JSON.stringify(es.rows.map((r) => r.workMin)),
    };
  } catch (e) {
    return { ok: false, reason: `the sheet could not be built (${e instanceof Error ? e.message : String(e)})` };
  }
}

async function main(): Promise<void> {
  const live = await liveWeather();
  const demo = await demoPath();
  const sheet = await printSheet();
  console.log(`PROOF_JSON ${JSON.stringify({ ...live, demoPath: demo, printSheet: sheet })}`);
}

void main();
