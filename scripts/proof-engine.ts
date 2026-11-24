// Live engine proof, run with `npx tsx scripts/proof-engine.ts` (scripts/proof.mjs does this).
// One real Open-Meteo archive call for Phoenix on 19 Jul 2023 through lib/open-meteo.ts, then the
// heat engine, the heavy-work planner and the mismatch search. Prints exactly one line that starts
// with PROOF_JSON followed by a JSON object; server log lines from the fetch helper may come first.
// It never invents a number: on failure the JSON says ok=false with the error code.

import { findSeedSite } from "../lib/data/seed";
import { codeOf } from "../lib/errors";
import { computeHeat, findMismatch, planDay } from "../lib/heat";
import { fetchHourly } from "../lib/open-meteo";

const LAT = 33.4484;
const LON = -112.074;
const DATE = "2023-07-19";

async function main(): Promise<void> {
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
    const out = {
      ok: true,
      source: result.source,
      date: result.date,
      hours: result.hours.length,
      latencyMs,
      mismatch: m
        ? {
            hour: m.hour,
            heatIndexC: m.heatIndexC,
            hiBand: m.hiBand,
            wbgtC: m.wbgtC,
            workMin: m.workMin,
            status: m.status,
          }
        : null,
    };
    console.log(`PROOF_JSON ${JSON.stringify(out)}`);
  } catch (e) {
    console.log(`PROOF_JSON ${JSON.stringify({ ok: false, code: codeOf(e), latencyMs: Date.now() - started })}`);
  }
}

void main();
