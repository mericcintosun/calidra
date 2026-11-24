import { describe, expect, it } from "vitest";
import { applyPlanParams, parsePlanParams, toPlanQuery } from "@/lib/plan-params";
import { findSeedSite } from "@/lib/data/seed";
import type { PlanSettings } from "@/lib/types";

const DEFAULTS: PlanSettings = {
  workload: "moderate",
  clothing: "workClothes",
  crewSize: 4,
  newWorkers: 0,
  newWorkerDay: 1,
  shiftStart: 7,
  shiftHours: 8,
};

const TUNED: PlanSettings = {
  workload: "heavy",
  clothing: "polyolefin",
  crewSize: 6,
  newWorkers: 2,
  newWorkerDay: 2,
  shiftStart: 5,
  shiftHours: 10,
};

describe("plan params", () => {
  it("round trips settings through the query string", () => {
    const query = toPlanQuery(TUNED);
    const back = applyPlanParams(DEFAULTS, parsePlanParams(new URLSearchParams(query)));
    expect(back).toEqual(TUNED);
  });

  it("reads the server searchParams record shape, arrays included", () => {
    const o = parsePlanParams({ workload: ["heavy", "light"], crew: "6", start: "5" });
    expect(o).toEqual({ workload: "heavy", crewSize: 6, shiftStart: 5 });
  });

  it("falls back to the site defaults for invalid or missing values and never throws", () => {
    const o = parsePlanParams({
      workload: "lava",
      clothing: "",
      crew: "-3",
      newWorkers: "two",
      day: "9",
      start: "5.5",
      hours: "7",
    });
    expect(o).toEqual({});
    expect(applyPlanParams(DEFAULTS, o)).toEqual(DEFAULTS);
    expect(parsePlanParams(undefined)).toEqual({});
  });

  it("keeps the valid keys when others are invalid", () => {
    const o = parsePlanParams(new URLSearchParams("workload=heavy&crew=abc&start=5"));
    expect(applyPlanParams(DEFAULTS, o)).toEqual({ ...DEFAULTS, workload: "heavy", shiftStart: 5 });
  });

  it("caps new workers at the crew size and rejects a start that does not fit the shift", () => {
    const o = parsePlanParams(new URLSearchParams("crew=3&newWorkers=5&start=20&hours=8"));
    const s = applyPlanParams(DEFAULTS, o);
    expect(s.newWorkers).toBe(3);
    // 20:00 plus 8 h runs past midnight, so the site's own start is kept.
    expect(s.shiftStart).toBe(DEFAULTS.shiftStart);
  });

  it("opens the Phoenix demo plan from DEMO.md step 8", () => {
    const site = findSeedSite("phoenix-desert-ridge-framing");
    expect(site).toBeDefined();
    const s = applyPlanParams(site!, parsePlanParams(new URLSearchParams("start=5")));
    expect(s).toMatchObject({ workload: "heavy", crewSize: 6, newWorkers: 2, newWorkerDay: 2, shiftStart: 5 });
  });
});
