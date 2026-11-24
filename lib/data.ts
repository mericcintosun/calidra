// Seed sites for Calidra. Each record is a crew on a real hot day (archive) or a crew in a
// place where it is summer right now (forecast). `profile` is a compact daily weather shape
// used to draw the collection and to render the site page before live Open-Meteo hours arrive.

export type Workload = "light" | "moderate" | "heavy" | "veryHeavy";
export type Clothing = "workClothes" | "polyolefin" | "doubleLayer" | "vaporBarrier";
export type SiteMode = "archive" | "forecast";

/** One hour of weather, in the units the WBGT engine expects. */
export interface HourlyWeather {
  /** Local wall-clock time at the site, "2023-07-19T13:00". */
  local: string;
  hour: number;
  /** UTC instant of the END of the hour (Open-Meteo radiation is a preceding-hour mean). */
  utcMs: number;
  tempC: number;
  /** Relative humidity in percent. */
  rh: number;
  /** Global horizontal shortwave radiation, W/m2. */
  solarWm2: number;
  /** Wind speed at 10 m, m/s. */
  windMs: number;
  cloudPct: number;
  pressureHpa: number;
}

/** A daily shape that seedHours() expands into 24 plausible hours. */
export interface DayProfile {
  tMinC: number;
  tMaxC: number;
  rhAtMin: number;
  rhAtMax: number;
  peakSolarWm2: number;
  windMs: number;
  cloudPct: number;
}

export interface PlanSettings {
  workload: Workload;
  clothing: Clothing;
  crewSize: number;
  newWorkers: number;
  /** Day on the job for the new workers, 1 to 5 (NIOSH 20 percent per day ramp). */
  newWorkerDay: number;
  shiftStart: number;
  shiftHours: number;
}

export interface Site extends PlanSettings {
  slug: string;
  name: string;
  trade: string;
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  utcOffsetHours: number;
  /** "YYYY-MM-DD", or "tomorrow" for live forecast sites. */
  date: string;
  /** Date used to place the sun when drawing the seed profile. */
  profileDate: string;
  mode: SiteMode;
  note: string;
  profile?: DayProfile;
  /** Real Open-Meteo hours saved when a site is created from /new. */
  snapshot?: HourlyWeather[];
  createdLocally?: boolean;
}

export const sites: Site[] = [
  {
    slug: "phoenix-desert-ridge-framing",
    name: "Desert Ridge framing crew",
    trade: "Residential framing",
    city: "Phoenix",
    region: "Arizona",
    country: "United States",
    lat: 33.4484,
    lon: -112.074,
    utcOffsetHours: -7,
    date: "2023-07-19",
    profileDate: "2023-07-19",
    mode: "archive",
    workload: "heavy",
    clothing: "workClothes",
    crewSize: 6,
    newWorkers: 2,
    newWorkerDay: 2,
    shiftStart: 7,
    shiftHours: 8,
    note: "Day 19 of the July 2023 run when Phoenix stayed at or above 110°F for 31 straight days.",
    profile: { tMinC: 35.6, tMaxC: 46.1, rhAtMin: 17, rhAtMax: 7, peakSolarWm2: 960, windMs: 3.2, cloudPct: 5 },
  },
  {
    slug: "houston-westchase-reroof",
    name: "Westchase reroof",
    trade: "Commercial roofing",
    city: "Houston",
    region: "Texas",
    country: "United States",
    lat: 29.7604,
    lon: -95.3698,
    utcOffsetHours: -5,
    date: "2023-08-24",
    profileDate: "2023-08-24",
    mode: "archive",
    workload: "veryHeavy",
    clothing: "workClothes",
    crewSize: 5,
    newWorkers: 1,
    newWorkerDay: 1,
    shiftStart: 7,
    shiftHours: 8,
    note: "Tear-off on a dark membrane roof during the late August 2023 Texas heat dome.",
    profile: { tMinC: 27.8, tMaxC: 41.7, rhAtMin: 78, rhAtMax: 32, peakSolarWm2: 880, windMs: 3.5, cloudPct: 15 },
  },
  {
    slug: "kerman-grape-thinning",
    name: "Kerman grape thinning",
    trade: "Vineyard labor",
    city: "Kerman",
    region: "California",
    country: "United States",
    lat: 36.7238,
    lon: -120.06,
    utcOffsetHours: -7,
    date: "2024-07-10",
    profileDate: "2024-07-10",
    mode: "archive",
    workload: "moderate",
    clothing: "workClothes",
    crewSize: 14,
    newWorkers: 4,
    newWorkerDay: 1,
    shiftStart: 6,
    shiftHours: 8,
    note: "Hand crew in open rows west of Fresno during the July 2024 San Joaquin Valley heat wave.",
    profile: { tMinC: 26.1, tMaxC: 44.4, rhAtMin: 32, rhAtMax: 11, peakSolarWm2: 940, windMs: 3.8, cloudPct: 0 },
  },
  {
    slug: "carmona-solar-install",
    name: "Carmona solar install",
    trade: "Utility solar racking",
    city: "Carmona",
    region: "Andalusia",
    country: "Spain",
    lat: 37.4712,
    lon: -5.6461,
    utcOffsetHours: 2,
    date: "2023-08-09",
    profileDate: "2023-08-09",
    mode: "archive",
    workload: "heavy",
    clothing: "workClothes",
    crewSize: 8,
    newWorkers: 2,
    newWorkerDay: 3,
    shiftStart: 7,
    shiftHours: 8,
    note: "Panel crew on bare ground east of Seville in the August 2023 Andalusian heat episode.",
    profile: { tMinC: 24.5, tMaxC: 43.8, rhAtMin: 52, rhAtMax: 14, peakSolarWm2: 900, windMs: 2.6, cloudPct: 0 },
  },
  {
    slug: "delhi-dwarka-rebar",
    name: "Dwarka rebar crew",
    trade: "Concrete and rebar",
    city: "New Delhi",
    region: "Delhi",
    country: "India",
    lat: 28.5921,
    lon: 77.046,
    utcOffsetHours: 5.5,
    date: "2024-05-29",
    profileDate: "2024-05-29",
    mode: "archive",
    workload: "veryHeavy",
    clothing: "workClothes",
    crewSize: 12,
    newWorkers: 3,
    newWorkerDay: 2,
    shiftStart: 8,
    shiftHours: 8,
    note: "Deck tying on an exposed slab during the late May 2024 North India heat wave.",
    profile: { tMinC: 31.2, tMaxC: 45.9, rhAtMin: 28, rhAtMax: 11, peakSolarWm2: 920, windMs: 4.1, cloudPct: 10 },
  },
  {
    slug: "ceyhan-cotton-irrigation",
    name: "Ceyhan cotton irrigation",
    trade: "Field irrigation",
    city: "Ceyhan",
    region: "Adana",
    country: "Türkiye",
    lat: 37.0247,
    lon: 35.8175,
    utcOffsetHours: 3,
    date: "2023-07-24",
    profileDate: "2023-07-24",
    mode: "archive",
    workload: "moderate",
    clothing: "workClothes",
    crewSize: 9,
    newWorkers: 3,
    newWorkerDay: 1,
    shiftStart: 6,
    shiftHours: 8,
    note: "Moving siphon pipes on the Çukurova plain, where humid mornings follow 40°C afternoons.",
    profile: { tMinC: 26.8, tMaxC: 41.5, rhAtMin: 74, rhAtMax: 27, peakSolarWm2: 920, windMs: 2.9, cloudPct: 5 },
  },
  {
    slug: "coral-gables-grounds",
    name: "Coral Gables grounds crew",
    trade: "Landscaping",
    city: "Coral Gables",
    region: "Florida",
    country: "United States",
    lat: 25.7215,
    lon: -80.2684,
    utcOffsetHours: -4,
    date: "2023-07-14",
    profileDate: "2023-07-14",
    mode: "archive",
    workload: "moderate",
    clothing: "workClothes",
    crewSize: 4,
    newWorkers: 1,
    newWorkerDay: 4,
    shiftStart: 7,
    shiftHours: 8,
    note: "Mowing and hedge work in the record-humid Miami summer of 2023.",
    profile: { tMinC: 28.3, tMaxC: 33.9, rhAtMin: 82, rhAtMax: 56, peakSolarWm2: 880, windMs: 4.2, cloudPct: 30 },
  },
  {
    slug: "cuiaba-soy-field-crew",
    name: "Cuiabá soybean field crew",
    trade: "Row crop labor",
    city: "Cuiabá",
    region: "Mato Grosso",
    country: "Brazil",
    lat: -15.6014,
    lon: -56.0979,
    utcOffsetHours: -4,
    date: "tomorrow",
    profileDate: "2026-11-25",
    mode: "forecast",
    workload: "heavy",
    clothing: "workClothes",
    crewSize: 10,
    newWorkers: 2,
    newWorkerDay: 1,
    shiftStart: 7,
    shiftHours: 8,
    note: "Wet-season planting near one of Brazil's hottest state capitals. Live forecast for tomorrow.",
    profile: { tMinC: 25.5, tMaxC: 36.8, rhAtMin: 82, rhAtMax: 40, peakSolarWm2: 980, windMs: 2.0, cloudPct: 35 },
  },
  {
    slug: "perth-kwinana-resurfacing",
    name: "Kwinana Freeway resurfacing",
    trade: "Asphalt paving",
    city: "Perth",
    region: "Western Australia",
    country: "Australia",
    lat: -31.9523,
    lon: 115.8613,
    utcOffsetHours: 8,
    date: "tomorrow",
    profileDate: "2026-11-25",
    mode: "forecast",
    workload: "heavy",
    clothing: "polyolefin",
    crewSize: 7,
    newWorkers: 1,
    newWorkerDay: 2,
    shiftStart: 7,
    shiftHours: 10,
    note: "Night crews are an option here. The planner shows when a day shift stops paying off.",
    profile: { tMinC: 17.2, tMaxC: 34.5, rhAtMin: 60, rhAtMax: 22, peakSolarWm2: 1030, windMs: 5.0, cloudPct: 5 },
  },
  {
    slug: "lujan-de-cuyo-drip-checks",
    name: "Luján de Cuyo drip line checks",
    trade: "Vineyard irrigation",
    city: "Luján de Cuyo",
    region: "Mendoza",
    country: "Argentina",
    lat: -33.0367,
    lon: -68.8794,
    utcOffsetHours: -3,
    date: "tomorrow",
    profileDate: "2026-11-25",
    mode: "forecast",
    workload: "light",
    clothing: "workClothes",
    crewSize: 3,
    newWorkers: 1,
    newWorkerDay: 1,
    shiftStart: 8,
    shiftHours: 8,
    note: "High desert sun at 900 m. Light work, but a first-day hire still gets a shorter plan.",
    profile: { tMinC: 17.8, tMaxC: 33.1, rhAtMin: 50, rhAtMax: 18, peakSolarWm2: 1050, windMs: 3.1, cloudPct: 10 },
  },
];

export function findSeedSite(slug: string): Site | undefined {
  return sites.find((s) => s.slug === slug);
}

/** Collection filters. They live in the URL: /?q=phoenix&work=heavy&mode=archive&sort=peak */
export type SortKey = "peak" | "rest" | "name";
export interface CollectionFilters {
  q: string;
  work: Workload | "all";
  mode: SiteMode | "all";
  sort: SortKey;
}

const WORK_KEYS: Workload[] = ["light", "moderate", "heavy", "veryHeavy"];

export function parseFilters(sp: Record<string, string | string[] | undefined>): CollectionFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const work = one(sp.work);
  const mode = one(sp.mode);
  const sort = one(sp.sort);
  return {
    q: one(sp.q).slice(0, 60),
    work: (WORK_KEYS as string[]).includes(work) ? (work as Workload) : "all",
    mode: mode === "archive" || mode === "forecast" ? mode : "all",
    sort: sort === "rest" || sort === "name" ? sort : "peak",
  };
}
