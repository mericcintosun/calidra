import { describe, expect, it } from "vitest";
import { SHEET_DICT, SHEET_KEYS, buildSheet, parseLang } from "@/lib/print-sheet";
import { applyPlanParams } from "@/lib/plan-params";
import { findSeedSite } from "@/lib/data/seed";
import { seedHours } from "@/lib/open-meteo";
import { bestStart, computeHeat, planDay, shiftTotals, type HourStatus } from "@/lib/heat";

const site = findSeedSite("phoenix-desert-ridge-framing")!;
const hours = seedHours(site);
// DEMO.md step 8: heavy work, crew 6, 2 new workers, start 05:00.
const settings = applyPlanParams(site, { shiftStart: 5 });

describe("buildSheet", () => {
  it("lists exactly the shift hours with work and rest adding to 60", () => {
    const sheet = buildSheet(site, hours, settings, "en");
    expect(sheet.rows).toHaveLength(settings.shiftHours);
    expect(sheet.rows[0].hourLabel).toBe("05:00");
    for (const r of sheet.rows) {
      expect(r.workMin + r.restMin).toBe(60);
      expect(r.newWorkMin).not.toBeNull();
    }
  });

  it("uses the engine's totals, not its own", () => {
    const sheet = buildSheet(site, hours, settings, "en");
    const plan = planDay(computeHeat(hours, site.lat, site.lon), settings);
    expect(sheet.totalRestMin).toBe(shiftTotals(plan, settings).crewRestMin);
    const best = bestStart(plan, settings);
    if (best.start !== settings.shiftStart && best.crewWorkMin > shiftTotals(plan, settings).crewWorkMin) {
      expect(sheet.bestLine).toContain(`${String(best.start).padStart(2, "0")}:00`);
    } else {
      expect(sheet.bestLine).toBe(SHEET_DICT.en.bestHere);
    }
  });

  it("gives the same numbers in English and Spanish with translated words", () => {
    const en = buildSheet(site, hours, settings, "en", { source: "seed", date: site.date });
    const es = buildSheet(site, hours, settings, "es", { source: "seed", date: site.date });
    expect(es.rows.map((r) => [r.hour, r.workMin, r.newWorkMin])).toEqual(en.rows.map((r) => [r.hour, r.workMin, r.newWorkMin]));
    expect(es.totalRestMin).toBe(en.totalRestMin);
    expect(es.title).toContain("Plan de trabajo y descanso");
    expect(es.settingsLine).toContain("cuadrilla de 6");
    expect(es.dateLine).toBe("19 jul 2023");
    expect(en.dateLine).toBe("19 Jul 2023");
    expect(es.sourceLine).not.toBe(en.sourceLine);
    expect(es.notice).toContain("no es consejo médico");
    expect(en.notice).toContain("not medical advice");
  });

  it("covers every status, workload and clothing key in both dictionaries", () => {
    const statuses: HourStatus[] = ["work", "pace", "rest", "stop"];
    for (const lang of ["en", "es"] as const) {
      const d = SHEET_DICT[lang];
      for (const s of statuses) expect(d.status[s]).toBeTruthy();
      for (const w of SHEET_KEYS.workloads) expect(d.workload[w]).toBeTruthy();
      for (const c of SHEET_KEYS.clothing) expect(d.clothing[c]).toBeTruthy();
    }
  });

  it("drops the new-worker column when the crew has no new workers", () => {
    const sheet = buildSheet(site, hours, { ...settings, newWorkers: 0 }, "en");
    expect(sheet.rows.every((r) => r.newWorkMin === null)).toBe(true);
    expect(sheet.newNote).toBeNull();
  });

  it("writes no dash characters into either language", () => {
    for (const lang of ["en", "es"] as const) {
      const text = JSON.stringify(buildSheet(site, hours, settings, lang));
      expect(text).not.toMatch(new RegExp("[\\u2013\\u2014]|-{2}"));
    }
  });
});

describe("parseLang", () => {
  it("defaults to English", () => {
    expect(parseLang(undefined)).toBe("en");
    expect(parseLang("fr")).toBe("en");
    expect(parseLang(["es", "en"])).toBe("es");
  });
});
