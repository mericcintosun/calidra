// Calidra heat engine. Pure TypeScript, runs on the server and in the browser.
//
// 1. Solar position from the NOAA low-precision equations.
// 2. Outdoor (in sun) WBGT from an energy balance after Liljegren et al. (2008),
//    "Modeling the Wet Bulb Globe Temperature Using Standard Meteorological Measurements",
//    J. Occup. Environ. Hyg. 5(10). Equations re-derived from the paper, no code copied.
// 3. Heat index from the NWS Rothfusz regression, for side-by-side comparison.
// 4. Work/rest minutes from the ACGIH TLV and action limit curves, with a NIOSH
//    acclimatization cap for new workers.

import type { Clothing, HourlyWeather, PlanSettings, Site, Workload } from "./data";

/* ---------- physical constants (Liljegren 2008, table 1) ---------- */
const SIGMA = 5.6696e-8;
const SOLAR_CONST = 1367;
const CP = 1003.5;
const M_AIR = 28.97;
const M_H2O = 18.015;
const R_GAS = 8314.34;
const R_AIR = R_GAS / M_AIR;
const PR = CP / (CP + 1.25 * R_AIR);
const RATIO = (CP * M_AIR) / M_H2O;

const EMIS_GLOBE = 0.95;
const ALB_GLOBE = 0.05;
const D_GLOBE = 0.0508;
const EMIS_WICK = 0.95;
const ALB_WICK = 0.4;
const D_WICK = 0.007;
const L_WICK = 0.0254;
const EMIS_SFC = 0.999;
const ALB_SFC = 0.45;
const CZA_MIN = 0.00873;
const MIN_WIND_2M = 0.5;

const rad = (d: number) => (d * Math.PI) / 180;

/** Cosine of the solar zenith angle at a UTC instant (NOAA low-precision algorithm). */
export function cosZenith(utcMs: number, latDeg: number, lonDeg: number): number {
  const d = utcMs / 86400000 + 2440587.5 - 2451545.0;
  const g = rad(357.529 + 0.98560028 * d);
  const q = 280.459 + 0.98564736 * d;
  const L = rad(q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
  const e = rad(23.439 - 0.00000036 * d);
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmstHours = (((18.697374558 + 24.06570982441908 * d) % 24) + 24) % 24;
  const ha = rad(gmstHours * 15 + lonDeg) - ra;
  const lat = rad(latDeg);
  return Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha);
}

/* ---------- air properties ---------- */
function esatHpa(tK: number): number {
  const tc = tK - 273.15;
  return 6.1121 * Math.exp((17.502 * tc) / (240.97 + tc)) * 1.004;
}
function viscosity(tK: number): number {
  const omega = ((tK / 97 - 2.9) / 0.4) * -0.034 + 1.048;
  return (2.6693e-6 * Math.sqrt(M_AIR * tK)) / (3.617 * 3.617 * omega);
}
function thermalConductivity(tK: number): number {
  return (CP + 1.25 * R_AIR) * viscosity(tK);
}
function vaporDiffusivity(tK: number, pHpa: number): number {
  return 2.26e-5 * Math.pow(tK / 273.15, 1.81) * (1013.25 / pHpa);
}
function heatOfVaporization(tK: number): number {
  return ((313.15 - tK) / 30) * 71100 + 2.4073e6;
}
function airDensity(tK: number, pHpa: number): number {
  return (pHpa * 100) / (R_AIR * tK);
}
function emissivityAtm(tK: number, rhFrac: number): number {
  return 0.575 * Math.pow(Math.max(rhFrac * esatHpa(tK), 0.01), 1 / 7);
}
function hSphere(tK: number, pHpa: number, speed: number): number {
  const re = (speed * airDensity(tK, pHpa) * D_GLOBE) / viscosity(tK);
  const nu = 2 + 0.6 * Math.sqrt(re) * Math.pow(PR, 1 / 3);
  return (nu * thermalConductivity(tK)) / D_GLOBE;
}
function hCylinder(tK: number, pHpa: number, speed: number): number {
  const re = (speed * airDensity(tK, pHpa) * D_WICK) / viscosity(tK);
  const nu = 0.281 * Math.pow(re, 0.6) * Math.pow(PR, 0.44);
  return (nu * thermalConductivity(tK)) / D_WICK;
}

/** Fraction of the global radiation arriving as direct beam (Liljegren eq. 13). */
function directFraction(solar: number, cza: number): number {
  if (cza <= CZA_MIN || solar <= 0) return 0;
  const sStar = Math.min(solar / (SOLAR_CONST * cza), 0.85);
  if (sStar <= 0) return 0;
  return Math.min(Math.max(Math.exp(3 - 1.34 * sStar - 1.65 / sStar), 0), 0.9);
}

/** Black globe temperature, K. Fixed-point iteration with 0.9/0.1 relaxation. */
function globeTemperature(tK: number, rhFrac: number, pHpa: number, speed: number, solar: number, fdb: number, cza: number): number {
  const eAtm = emissivityAtm(tK, rhFrac);
  const longwave = 0.5 * (eAtm * tK ** 4 + EMIS_SFC * tK ** 4);
  // Guard: below ~6 degrees of sun elevation the beam term is held at its 6 degree value,
  // because hourly-mean radiation paired with a mid-hour sun angle overstates beam strength.
  const beam = cza > CZA_MIN ? fdb * (1 / (2 * Math.max(cza, 0.1)) - 1) : 0;
  const shortwave = (solar / (2 * EMIS_GLOBE * SIGMA)) * (1 - ALB_GLOBE) * (beam + 1 + ALB_SFC);
  let tg = tK;
  for (let i = 0; i < 400; i++) {
    const h = hSphere(0.5 * (tg + tK), pHpa, speed);
    const next = Math.pow(Math.max(longwave - (h / (EMIS_GLOBE * SIGMA)) * (tg - tK) + shortwave, 1), 0.25);
    if (Math.abs(next - tg) < 0.02) return next;
    tg = 0.9 * tg + 0.1 * next;
  }
  return tg;
}

/** Natural (unventilated, in sun) wet bulb temperature, K. */
function naturalWetBulb(tK: number, rhFrac: number, pHpa: number, speed: number, solar: number, fdb: number, cza: number): number {
  const eAir = rhFrac * esatHpa(tK);
  const eAtm = emissivityAtm(tK, rhFrac);
  const czaSafe = Math.max(cza, 0.1);
  const tanZ = Math.tan(Math.acos(czaSafe));
  const solarTerm =
    cza > CZA_MIN && solar > 0
      ? (1 - ALB_WICK) * solar * ((1 - fdb) * (1 + (0.25 * D_WICK) / L_WICK) + fdb * (tanZ / Math.PI + (0.25 * D_WICK) / L_WICK) + ALB_SFC)
      : 0;
  // Dew point as the first guess.
  const lnE = Math.log(Math.max(eAir, 0.01) / 6.1121);
  let tw = 273.15 + (240.97 * lnE) / (17.502 - lnE);
  for (let i = 0; i < 400; i++) {
    const tRef = 0.5 * (tw + tK);
    const h = hCylinder(tRef, pHpa, speed);
    const fAtm = SIGMA * EMIS_WICK * (0.5 * (eAtm * tK ** 4 + EMIS_SFC * tK ** 4) - tw ** 4) + solarTerm;
    const eWick = esatHpa(tw);
    const sc = viscosity(tRef) / (airDensity(tRef, pHpa) * vaporDiffusivity(tRef, pHpa));
    const next =
      tK - (heatOfVaporization(tRef) / RATIO) * ((eWick - eAir) / (pHpa - eWick)) * Math.pow(PR / sc, 0.56) + fAtm / h;
    if (Math.abs(next - tw) < 0.02) return next;
    tw = 0.9 * tw + 0.1 * next;
  }
  return tw;
}

/* ---------- heat index (NWS) ---------- */
export type HeatIndexBand = "Below caution" | "Caution" | "Extreme caution" | "Danger" | "Extreme danger";

export function heatIndexC(tempC: number, rh: number): number {
  const T = tempC * 1.8 + 32;
  let hi = 0.5 * (T + 61 + (T - 68) * 1.2 + rh * 0.094);
  if ((hi + T) / 2 >= 80) {
    hi =
      -42.379 + 2.04901523 * T + 10.14333127 * rh - 0.22475541 * T * rh - 0.00683783 * T * T - 0.05481717 * rh * rh +
      0.00122874 * T * T * rh + 0.00085282 * T * rh * rh - 0.00000199 * T * T * rh * rh;
    if (rh < 13 && T >= 80 && T <= 112) hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
    else if (rh > 85 && T >= 80 && T <= 87) hi += ((rh - 85) / 10) * ((87 - T) / 5);
  }
  return (hi - 32) / 1.8;
}

export function heatIndexBand(hiC: number): HeatIndexBand {
  const f = hiC * 1.8 + 32;
  if (f >= 125) return "Extreme danger";
  if (f >= 103) return "Danger";
  if (f >= 90) return "Extreme caution";
  if (f >= 80) return "Caution";
  return "Below caution";
}

/* ---------- per-hour physics ---------- */
export interface HeatHour extends HourlyWeather {
  cosZ: number;
  wind2m: number;
  globeC: number;
  wetBulbC: number;
  wbgtC: number;
  heatIndexC: number;
  hiBand: HeatIndexBand;
}

export function computeHeat(hours: HourlyWeather[], lat: number, lon: number): HeatHour[] {
  return hours.map((h) => {
    // Radiation is the mean of the preceding hour, so place the sun at mid-hour.
    const cza = cosZenith(h.utcMs - 30 * 60 * 1000, lat, lon);
    const smax = cza > CZA_MIN ? SOLAR_CONST * cza : 0;
    const solar = cza > CZA_MIN ? Math.min(Math.max(h.solarWm2, 0), smax) : 0;
    const fdb = directFraction(solar, cza);
    const tK = h.tempC + 273.15;
    const rhFrac = Math.min(Math.max(h.rh, 1), 100) / 100;
    // 10 m wind to 2 m with a neutral power law, floored for still air.
    const wind2m = Math.max(h.windMs * Math.pow(2 / 10, 0.2), MIN_WIND_2M);
    const p = h.pressureHpa > 500 ? h.pressureHpa : 1013.25;
    const tg = globeTemperature(tK, rhFrac, p, wind2m, solar, fdb, cza) - 273.15;
    const tw = naturalWetBulb(tK, rhFrac, p, wind2m, solar, fdb, cza) - 273.15;
    const wbgt = 0.7 * tw + 0.2 * tg + 0.1 * h.tempC;
    const hi = heatIndexC(h.tempC, h.rh);
    return {
      ...h,
      cosZ: cza,
      wind2m,
      globeC: round1(tg),
      wetBulbC: round1(tw),
      wbgtC: round1(wbgt),
      heatIndexC: round1(hi),
      hiBand: heatIndexBand(hi),
    };
  });
}

/* ---------- ACGIH work/rest planning ---------- */
export const WORKLOADS: Record<Workload, { label: string; watts: number; example: string }> = {
  light: { label: "Light", watts: 180, example: "Inspections, light tools, driving" },
  moderate: { label: "Moderate", watts: 300, example: "Hand weeding, mowing, steady walking" },
  heavy: { label: "Heavy", watts: 415, example: "Framing, carrying lumber, shoveling" },
  veryHeavy: { label: "Very heavy", watts: 520, example: "Roof tear-off, rebar at pace, digging" },
};
export const WORKLOAD_KEYS = Object.keys(WORKLOADS) as Workload[];

export const CLOTHING: Record<Clothing, { label: string; cav: number }> = {
  workClothes: { label: "Work clothes", cav: 0 },
  polyolefin: { label: "Polyolefin coveralls", cav: 1 },
  doubleLayer: { label: "Double-layer coveralls", cav: 3 },
  vaporBarrier: { label: "Vapor-barrier suit", cav: 11 },
};
export const CLOTHING_KEYS = Object.keys(CLOTHING) as Clothing[];

/** Metabolic rate assumed during rest breaks, W. */
export const REST_WATTS = 115;
/** ACGIH TLV (acclimatized): WBGT = 56.7 - 11.5 log10(M). */
export const TLV = { intercept: 56.7, slope: 11.5 };
/** ACGIH action limit (unacclimatized): WBGT = 59.9 - 14.1 log10(M). */
export const ACTION_LIMIT = { intercept: 59.9, slope: 14.1 };

export function limitAt(watts: number, curve: { intercept: number; slope: number }): number {
  return curve.intercept - curve.slope * Math.log10(watts);
}

/** Work minutes per hour such that the time-weighted metabolic rate stays under the curve. */
function workMinutes(wbgtEff: number, watts: number, curve: { intercept: number; slope: number }): number {
  const maxWatts = Math.pow(10, (curve.intercept - wbgtEff) / curve.slope);
  if (maxWatts >= watts) return 60;
  if (maxWatts <= REST_WATTS) return 0;
  const frac = (maxWatts - REST_WATTS) / (watts - REST_WATTS);
  return Math.floor((frac * 60) / 5) * 5;
}

export type HourStatus = "work" | "pace" | "rest" | "stop";
export const STATUS_LABEL: Record<HourStatus, string> = {
  work: "Normal work",
  pace: "Pace with breaks",
  rest: "Mostly rest",
  stop: "Stop work",
};

export function statusOf(minutes: number): HourStatus {
  if (minutes >= 60) return "work";
  if (minutes >= 30) return "pace";
  if (minutes > 0) return "rest";
  return "stop";
}

export interface HourPlan extends HeatHour {
  effectiveC: number;
  workMin: number;
  newWorkMin: number;
  status: HourStatus;
  newStatus: HourStatus;
}

export function planDay(heat: HeatHour[], s: PlanSettings): HourPlan[] {
  const watts = WORKLOADS[s.workload].watts;
  const cav = CLOTHING[s.clothing].cav;
  // NIOSH: new workers start at 20 percent of a normal exposure and add 20 percent a day.
  const rampCap = Math.round((Math.min(Math.max(s.newWorkerDay, 1), 5) * 0.2 * 60) / 5) * 5;
  return heat.map((h) => {
    const effectiveC = round1(h.wbgtC + cav);
    const workMin = workMinutes(effectiveC, watts, TLV);
    const newWorkMin = Math.min(workMinutes(effectiveC, watts, ACTION_LIMIT), rampCap);
    return { ...h, effectiveC, workMin, newWorkMin, status: statusOf(workMin), newStatus: statusOf(newWorkMin) };
  });
}

export interface ShiftTotals {
  start: number;
  crewWorkMin: number;
  crewRestMin: number;
}

export function shiftTotals(plan: HourPlan[], s: PlanSettings, start = s.shiftStart): ShiftTotals {
  const veterans = Math.max(s.crewSize - s.newWorkers, 0);
  const fresh = Math.min(s.newWorkers, s.crewSize);
  let crewWorkMin = 0;
  let crewRestMin = 0;
  for (const h of plan) {
    if (h.hour < start || h.hour >= start + s.shiftHours) continue;
    crewWorkMin += h.workMin * veterans + h.newWorkMin * fresh;
    crewRestMin += (60 - h.workMin) * veterans + (60 - h.newWorkMin) * fresh;
  }
  return { start, crewWorkMin, crewRestMin };
}

export const EARLIEST_START = 4;

/** Scan every start hour from 04:00 and keep the one with the most productive crew-minutes. */
export function bestStart(plan: HourPlan[], s: PlanSettings): ShiftTotals {
  let best = shiftTotals(plan, s, s.shiftStart);
  for (let start = EARLIEST_START; start + s.shiftHours <= 24; start++) {
    const t = shiftTotals(plan, s, start);
    const better =
      t.crewWorkMin > best.crewWorkMin ||
      (t.crewWorkMin === best.crewWorkMin && Math.abs(start - s.shiftStart) < Math.abs(best.start - s.shiftStart));
    if (better) best = t;
  }
  return best;
}

/** First hour where the heat index reads Caution or lower but sun WBGT says rest or stop. */
export function findMismatch(plan: HourPlan[]): HourPlan | undefined {
  return plan.find((h) => (h.hiBand === "Below caution" || h.hiBand === "Caution") && (h.status === "rest" || h.status === "stop"));
}

const BAND_RANK: Record<HeatIndexBand, number> = {
  "Below caution": 0,
  Caution: 1,
  "Extreme caution": 2,
  Danger: 3,
  "Extreme danger": 4,
};

/**
 * Among hours where sun WBGT says rest or stop, the one whose heat index reads the lowest band
 * (earliest hour on ties). On days with no "Caution" hour, this still shows the gap between
 * the shade number and the sun verdict, for example "Extreme caution" against "stop".
 */
export function findBandGap(plan: HourPlan[]): HourPlan | undefined {
  let best: HourPlan | undefined;
  for (const h of plan) {
    if (h.status !== "rest" && h.status !== "stop") continue;
    if (!best || BAND_RANK[h.hiBand] < BAND_RANK[best.hiBand] || (BAND_RANK[h.hiBand] === BAND_RANK[best.hiBand] && h.hour < best.hour)) {
      best = h;
    }
  }
  return best;
}

/* ---------- collection summaries ---------- */
export interface SiteSummary {
  slug: string;
  name: string;
  trade: string;
  city: string;
  country: string;
  dateLabel: string;
  mode: Site["mode"];
  workload: Workload;
  crewSize: number;
  shiftStart: number;
  shiftHours: number;
  peakWbgtC: number;
  peakHour: number;
  crewRestMin: number;
  best: ShiftTotals;
  strip: HourStatus[];
  local: boolean;
}

export function summarizeSite(site: Site, hours: HourlyWeather[]): SiteSummary {
  const plan = planDay(computeHeat(hours, site.lat, site.lon), site);
  const peak = plan.reduce<HourPlan | undefined>((a, h) => (!a || h.wbgtC > a.wbgtC ? h : a), undefined);
  return {
    slug: site.slug,
    name: site.name,
    trade: site.trade,
    city: site.city,
    country: site.country,
    dateLabel: formatSiteDate(site.date),
    mode: site.mode,
    workload: site.workload,
    crewSize: site.crewSize,
    shiftStart: site.shiftStart,
    shiftHours: site.shiftHours,
    peakWbgtC: peak?.wbgtC ?? 0,
    peakHour: peak?.hour ?? 0,
    crewRestMin: shiftTotals(plan, site).crewRestMin,
    best: bestStart(plan, site),
    strip: plan.map((h) => h.status),
    local: Boolean(site.createdLocally),
  };
}

/* ---------- formatting ---------- */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatSiteDate(date: string): string {
  if (date === "tomorrow") return "Tomorrow";
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** YYYY-MM-DD in the local calendar of whoever runs this (browser or server). */
export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Turns "tomorrow" into a YYYY-MM-DD date; any other value passes through. */
export function resolveDate(date: string): string {
  if (date !== "tomorrow") return date;
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return isoDate(d);
}

export function hourLabel(h: number): string {
  return `${String(((h % 24) + 24) % 24).padStart(2, "0")}:00`;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export const STATUS_FILL: Record<HourStatus, string> = {
  work: "bg-ok",
  pace: "bg-warn",
  rest: "bg-bad/60",
  stop: "bg-bad",
};
