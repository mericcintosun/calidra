import { describe, expect, it } from "vitest";
import { findSeedSite } from "@/lib/data/seed";
import {
  EARLIEST_START,
  TLV,
  bestStart,
  computeHeat,
  findBandGap,
  findMismatch,
  limitAt,
  planDay,
  type HeatHour,
  type HeatIndexBand,
} from "@/lib/heat";
import { seedHours } from "@/lib/open-meteo";
import type { HourlyWeather, PlanSettings } from "@/lib/types";
import {
  ALL_FIXTURES,
  clearNight,
  desertNoon,
  humidNoon,
  overcastNoon,
  stillAirAfternoon,
  type HourFixture,
} from "./fixtures/hours";
import reference from "./wbgt-reference.json";

function heatOf(f: HourFixture, patch: Partial<HourlyWeather> = {}): HeatHour {
  return computeHeat([{ ...f.hour, ...patch }], f.lat, f.lon)[0];
}

const HEAVY: PlanSettings = {
  workload: "heavy",
  clothing: "workClothes",
  crewSize: 6,
  newWorkers: 2,
  newWorkerDay: 1,
  shiftStart: 7,
  shiftHours: 8,
};

/** A hand-built hour: only wbgtC and hiBand matter to the planner and findMismatch. */
function hourAt(hour: number, wbgtC: number, hiBand: HeatIndexBand = "Danger"): HeatHour {
  return {
    local: `2023-07-19T${String(hour).padStart(2, "0")}:00`,
    hour,
    utcMs: Date.UTC(2023, 6, 19, hour),
    tempC: 35,
    rh: 30,
    solarWm2: 0,
    windMs: 2,
    cloudPct: 0,
    pressureHpa: 1013.25,
    cosZ: 0,
    wind2m: 1.5,
    globeC: wbgtC,
    wetBulbC: wbgtC,
    wbgtC,
    heatIndexC: 35,
    hiBand,
  };
}

describe("heat engine physics on fixed hours", () => {
  it("puts the sun globe above air temperature at midday in sun", () => {
    for (const f of [desertNoon, humidNoon, stillAirAfternoon]) {
      const h = heatOf(f);
      expect(h.cosZ, f.name).toBeGreaterThan(0.5);
      expect(h.globeC, f.name).toBeGreaterThan(f.hour.tempC);
    }
  });

  it("gives a lower WBGT at night than at noon at the same place", () => {
    expect(heatOf(clearNight).cosZ).toBeLessThan(0);
    expect(heatOf(clearNight).wbgtC).toBeLessThan(heatOf(desertNoon).wbgtC);
  });

  it("raises WBGT with more sun when air, humidity and wind are equal", () => {
    const sunny = heatOf(humidNoon);
    const grey = heatOf(overcastNoon);
    expect(sunny.globeC).toBeGreaterThan(grey.globeC);
    expect(sunny.wbgtC).toBeGreaterThan(grey.wbgtC);
  });

  it("floors still air at 0.5 m/s and runs the globe hotter than in a breeze", () => {
    const still = heatOf(stillAirAfternoon);
    const breezy = heatOf(stillAirAfternoon, { windMs: 5 });
    expect(still.wind2m).toBe(0.5);
    expect(still.globeC).toBeGreaterThan(breezy.globeC);
  });

  it("keeps every output finite and inside a physical range", () => {
    for (const f of ALL_FIXTURES) {
      const h = heatOf(f);
      for (const v of [h.globeC, h.wetBulbC, h.wbgtC, h.heatIndexC]) expect(Number.isFinite(v), f.name).toBe(true);
      // WBGT is a weighted mean of wet bulb, globe and air; outdoors on Earth it stays within these bounds.
      expect(h.wbgtC, f.name).toBeGreaterThan(0);
      expect(h.wbgtC, f.name).toBeLessThan(45);
      // The natural wet bulb cannot exceed air temperature by much, and a wet wick in dry air sits well below it.
      expect(h.wetBulbC, f.name).toBeLessThan(f.hour.tempC + 3);
    }
  });
});

describe("work/rest planner on hand-built hours", () => {
  it("uses the ACGIH TLV for heavy work, 56.7 - 11.5 log10(415), about 26.6 C", () => {
    const tlv = limitAt(415, TLV);
    expect(tlv).toBeCloseTo(56.7 - 11.5 * Math.log10(415), 10);
    expect(tlv).toBeGreaterThan(26.5);
    expect(tlv).toBeLessThan(26.7);
  });

  it("gives 60 work minutes at effective WBGT 20 and 0 with status stop at 40", () => {
    const [cool, hot] = planDay([hourAt(10, 20), hourAt(14, 40)], HEAVY);
    expect(cool.workMin).toBe(60);
    expect(cool.status).toBe("work");
    expect(hot.workMin).toBe(0);
    expect(hot.status).toBe("stop");
  });

  it("never lets new workers exceed the NIOSH ramp cap", () => {
    const wbgts = [15, 20, 24, 26, 28, 30, 33, 40];
    for (let day = 1; day <= 5; day++) {
      // 20 percent of a 60 minute exposure per day on the job, rounded to the 5 minute grid.
      const cap = Math.round((day * 0.2 * 60) / 5) * 5;
      const plan = planDay(wbgts.map((w, i) => hourAt(8 + i, w)), { ...HEAVY, newWorkerDay: day });
      for (const h of plan) expect(h.newWorkMin, `day ${day} wbgt ${h.wbgtC}`).toBeLessThanOrEqual(cap);
    }
    const dayOne = planDay([hourAt(9, 20)], HEAVY)[0];
    expect(dayOne.newWorkMin).toBe(10);
  });

  it("never picks a shift start before EARLIEST_START, even when the night is coolest", () => {
    // WBGT climbs one degree an hour from 18 C at midnight, so the unconstrained best start is 00:00.
    const plan = planDay(Array.from({ length: 24 }, (_, h) => hourAt(h, 18 + h)), { ...HEAVY, shiftStart: 10 });
    const best = bestStart(plan, { ...HEAVY, shiftStart: 10 });
    expect(best.start).toBeGreaterThanOrEqual(EARLIEST_START);
    expect(best.start).toBe(EARLIEST_START);
  });

  it("finds the hour where the heat index reads Caution but sun WBGT says stop", () => {
    const plan = planDay(
      [hourAt(9, 22, "Caution"), hourAt(10, 40, "Danger"), hourAt(11, 40, "Caution"), hourAt(12, 41, "Caution")],
      HEAVY
    );
    const m = findMismatch(plan);
    expect(m).toBeDefined();
    expect(m?.hour).toBe(11);
    expect(m?.hiBand).toBe("Caution");
    expect(["stop", "rest"]).toContain(m?.status);
  });
});

describe("demo contract", () => {
  // DEMO.md steps 2 and 4. Phase 2 found that the Phoenix seed has no hour where the heat index
  // reads "Caution" or lower (its coolest hour is 35.6 C at 17 percent humidity, heat index about
  // 92 F, "Extreme caution"), so findMismatch returns nothing there. The seed is not tuned and
  // findMismatch is not changed; the site page falls back to findBandGap, which shows the lowest
  // heat index band among the hours sun WBGT calls rest or stop.
  it("Phoenix seed hours give a band gap hour through computeHeat, planDay and findBandGap", () => {
    const site = findSeedSite("phoenix-desert-ridge-framing");
    expect(site).toBeDefined();
    if (!site) return;
    const plan = planDay(computeHeat(seedHours(site), site.lat, site.lon), site);
    expect(plan).toHaveLength(24);
    const gap = findBandGap(plan);
    expect(gap).toBeDefined();
    expect(["stop", "rest"]).toContain(gap?.status);
  });

  // findMismatch keeps its own contract on hand-built hours: a "Caution" hour that WBGT calls stop.
  it("findMismatch still returns a Caution hour that sun WBGT calls stop", () => {
    const plan = planDay([hourAt(8, 22, "Caution"), hourAt(9, 40, "Caution")], HEAVY);
    const m = findMismatch(plan);
    expect(m?.hour).toBe(9);
    expect(m?.hiBand).toBe("Caution");
    expect(m?.status).toBe("stop");
  });

  it("findBandGap picks the lowest band, earliest hour on ties, and skips work hours", () => {
    const plan = planDay(
      [
        hourAt(9, 20, "Below caution"),
        hourAt(10, 40, "Danger"),
        hourAt(11, 40, "Extreme caution"),
        hourAt(12, 41, "Extreme caution"),
      ],
      HEAVY
    );
    const gap = findBandGap(plan);
    expect(gap?.hour).toBe(11);
    expect(gap?.hiBand).toBe("Extreme caution");
    expect(findBandGap(planDay([hourAt(9, 20, "Caution")], HEAVY))).toBeUndefined();
  });
});

/* ---------- OSHA reference points (filled in by hand, see HANDOFF.md) ---------- */

interface OshaPoint {
  name: string;
  tempC: number;
  rh: number;
  solarWm2: number;
  windMs: number;
  lat: number;
  lon: number;
  /** ISO instant the OSHA calculator was set to, for example "2023-07-19T19:00:00Z". */
  utc: string;
  oshaWbgtC: number;
}

const points = reference as unknown as OshaPoint[];

// The OSHA comparison is data-gated: each point in tests/wbgt-reference.json becomes one asserting
// test. While the file is [] there is nothing to compare, so no test is registered (a permanent
// it.skip placeholder only made every proof run report skipped=1). The pending validation is
// tracked in README "What we would build next" and HANDOFF.md, never filled with invented values.
if (points.length > 0) {
describe("OSHA Outdoor WBGT Calculator reference points", () => {
  for (const p of points) {
    it(`${p.name}: engine within 1 C of OSHA ${p.oshaWbgtC} C`, () => {
      const at = Date.parse(p.utc);
      // computeHeat places the sun at the middle of the hour ending at utcMs, so add 30 minutes.
      const hour: HourlyWeather = {
        local: p.utc.slice(0, 16),
        hour: new Date(at).getUTCHours(),
        utcMs: at + 30 * 60 * 1000,
        tempC: p.tempC,
        rh: p.rh,
        solarWm2: p.solarWm2,
        windMs: p.windMs,
        cloudPct: 0,
        pressureHpa: 1013.25,
      };
      const h = computeHeat([hour], p.lat, p.lon)[0];
      expect(Math.abs(h.wbgtC - p.oshaWbgtC)).toBeLessThanOrEqual(1);
    });
  }
});
}
