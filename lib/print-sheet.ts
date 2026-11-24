// The crew sheet: a one-page work/rest plan for one site, in English or Spanish.
// Pure: no fetch, no window, no server config. Every number comes from the same engine as the
// site page (computeHeat, planDay, shiftTotals, bestStart); this file only picks the shift rows
// and words them. Static dictionaries, no translation service.

import {
  CLOTHING,
  WORKLOADS,
  bestStart,
  computeHeat,
  hourLabel,
  planDay,
  shiftTotals,
  type HourStatus,
} from "./heat";
import type { Clothing, HourlyWeather, PlanSettings, Site, WeatherSource, Workload } from "./types";

export type SheetLang = "en" | "es";
export const SHEET_LANGS: SheetLang[] = ["en", "es"];

/** "es" when asked for, English otherwise. Accepts the raw searchParams value. */
export function parseLang(v: string | string[] | undefined): SheetLang {
  const one = Array.isArray(v) ? v[0] : v;
  return one === "es" ? "es" : "en";
}

export interface Dict {
  langName: string;
  eyebrow: string;
  title: (site: string) => string;
  status: Record<HourStatus, string>;
  workload: Record<Workload, string>;
  clothing: Record<Clothing, string>;
  settings: (p: { workload: string; clothing: string; crew: number; fresh: number; day: number; from: string; to: string }) => string;
  date: (date: string) => string;
  source: Record<WeatherSource, string>;
  columns: { hour: string; wbgt: string; status: string; work: string; rest: string; newWork: string };
  totalRest: (n: string) => string;
  best: (p: { from: string; to: string; saved: string }) => string;
  bestHere: string;
  newNote: string;
  notice: string;
  scan: string;
  print: string;
  back: string;
  language: string;
  minutes: string;
}

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function dateWith(months: string[], tomorrow: string) {
  return (date: string) => {
    if (date === "tomorrow") return tomorrow;
    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) return date;
    return `${d} ${months[m - 1]} ${y}`;
  };
}

export const SHEET_DICT: Record<SheetLang, Dict> = {
  en: {
    langName: "English",
    eyebrow: "Calidra crew sheet",
    title: (site) => `Heat work/rest plan: ${site}`,
    status: { work: "Normal work", pace: "Pace with breaks", rest: "Mostly rest", stop: "Stop work" },
    workload: { light: "Light", moderate: "Moderate", heavy: "Heavy", veryHeavy: "Very heavy" },
    clothing: {
      workClothes: "work clothes",
      polyolefin: "polyolefin coveralls",
      doubleLayer: "double-layer coveralls",
      vaporBarrier: "vapor-barrier suit",
    },
    settings: (p) =>
      `${p.workload} work, ${p.clothing}, crew of ${p.crew}, ${p.fresh} new this week (day ${p.day}), shift ${p.from} to ${p.to}.`,
    date: dateWith(MONTHS_EN, "Tomorrow"),
    source: {
      archive: "Hours from the Open-Meteo historical archive.",
      forecast: "Hours from the Open-Meteo forecast.",
      seed: "Hours from a stored sample day profile, not a live weather feed.",
    },
    columns: {
      hour: "Hour",
      wbgt: "Sun WBGT",
      status: "Plan",
      work: "Work min",
      rest: "Rest min",
      newWork: "New workers: work min",
    },
    totalRest: (n) => `Rest the crew owes in this shift: ${n} crew-minutes.`,
    best: (p) => `Best window: start at ${p.from} (end ${p.to}) and save ${p.saved} crew-minutes of rest.`,
    bestHere: "This start is the best window for the day.",
    newNote: "Workers new this week follow the shorter plan in the last column.",
    notice:
      "Screening tool, not medical advice. It does not replace on-site WBGT measurement or your employer's heat illness prevention program. Anyone with symptoms stops work.",
    scan: "Scan to open this plan",
    print: "Print",
    back: "Back to the plan",
    language: "Language",
    minutes: "min",
  },
  es: {
    langName: "Español",
    eyebrow: "Hoja de cuadrilla Calidra",
    title: (site) => `Plan de trabajo y descanso por calor: ${site}`,
    status: { work: "Trabajo normal", pace: "Ritmo con pausas", rest: "Casi todo descanso", stop: "Parar el trabajo" },
    workload: { light: "Ligero", moderate: "Moderado", heavy: "Pesado", veryHeavy: "Muy pesado" },
    clothing: {
      workClothes: "ropa de trabajo",
      polyolefin: "overol de poliolefina",
      doubleLayer: "overol de doble capa",
      vaporBarrier: "traje con barrera de vapor",
    },
    settings: (p) =>
      `Trabajo ${p.workload.toLowerCase()}, ${p.clothing}, cuadrilla de ${p.crew}, ${p.fresh} nuevos esta semana (día ${p.day}), turno de ${p.from} a ${p.to}.`,
    date: dateWith(MONTHS_ES, "Mañana"),
    source: {
      archive: "Horas del archivo histórico de Open-Meteo.",
      forecast: "Horas del pronóstico de Open-Meteo.",
      seed: "Horas de un perfil de día de muestra guardado, no de un servicio meteorológico en vivo.",
    },
    columns: {
      hour: "Hora",
      wbgt: "WBGT al sol",
      status: "Plan",
      work: "Min. trabajo",
      rest: "Min. descanso",
      newWork: "Nuevos: min. trabajo",
    },
    totalRest: (n) => `Descanso que debe la cuadrilla en este turno: ${n} minutos por persona.`,
    best: (p) => `Mejor horario: empezar a las ${p.from} (terminar a las ${p.to}) ahorra ${p.saved} minutos por persona de descanso.`,
    bestHere: "Esta hora de inicio es el mejor horario del día.",
    newNote: "Los trabajadores nuevos de esta semana siguen el plan más corto de la última columna.",
    notice:
      "Herramienta de evaluación, no es consejo médico. No reemplaza la medición de WBGT en el sitio ni el programa de prevención de enfermedades por calor de su empleador. Quien tenga síntomas deja de trabajar.",
    scan: "Escanee para abrir este plan",
    print: "Imprimir",
    back: "Volver al plan",
    language: "Idioma",
    minutes: "min",
  },
};

export interface SheetRow {
  hour: number;
  hourLabel: string;
  wbgtC: number;
  status: HourStatus;
  statusLabel: string;
  workMin: number;
  restMin: number;
  /** Null when the crew has no new workers. */
  newWorkMin: number | null;
  newStatus: HourStatus;
}

export interface CrewSheetData {
  lang: SheetLang;
  title: string;
  eyebrow: string;
  siteName: string;
  placeLine: string;
  dateLine: string;
  settingsLine: string;
  sourceLine: string;
  columns: Dict["columns"];
  rows: SheetRow[];
  totalRestMin: number;
  totalRestLine: string;
  bestLine: string;
  newNote: string | null;
  notice: string;
  labels: { scan: string; print: string; back: string; language: string; minutes: string };
}

const NUMBER_LOCALE: Record<SheetLang, string> = { en: "en-US", es: "es-MX" };

/**
 * One sheet for a site, its hours and the lead's settings. Rows are the shift hours only, so
 * the sheet fits one printed page. `opts.date` and `opts.source` describe the hours actually
 * used (from getHours); without them the site's own date is shown and no source line.
 */
export function buildSheet(
  site: Site,
  hours: HourlyWeather[],
  settings: PlanSettings,
  lang: SheetLang,
  opts: { date?: string; source?: WeatherSource } = {}
): CrewSheetData {
  const t = SHEET_DICT[lang];
  const plan = planDay(computeHeat(hours, site.lat, site.lon), settings);
  const end = settings.shiftStart + settings.shiftHours;
  const fresh = Math.min(settings.newWorkers, settings.crewSize);
  const totals = shiftTotals(plan, settings);
  const best = bestStart(plan, settings);
  const fmt = (n: number) => n.toLocaleString(NUMBER_LOCALE[lang]);

  const rows: SheetRow[] = plan
    .filter((h) => h.hour >= settings.shiftStart && h.hour < end)
    .map((h) => ({
      hour: h.hour,
      hourLabel: hourLabel(h.hour),
      wbgtC: h.wbgtC,
      status: h.status,
      statusLabel: t.status[h.status],
      workMin: h.workMin,
      restMin: 60 - h.workMin,
      newWorkMin: fresh > 0 ? h.newWorkMin : null,
      newStatus: h.newStatus,
    }));

  const better = best.start !== settings.shiftStart && best.crewWorkMin > totals.crewWorkMin;
  const bestLine = better
    ? t.best({
        from: hourLabel(best.start),
        to: hourLabel(best.start + settings.shiftHours),
        saved: fmt(totals.crewRestMin - best.crewRestMin),
      })
    : t.bestHere;

  return {
    lang,
    eyebrow: t.eyebrow,
    title: t.title(site.name),
    siteName: site.name,
    placeLine: [site.city, site.region, site.country].filter(Boolean).join(", "),
    dateLine: t.date(opts.date ?? site.date),
    settingsLine: t.settings({
      workload: t.workload[settings.workload],
      clothing: t.clothing[settings.clothing],
      crew: settings.crewSize,
      fresh,
      day: settings.newWorkerDay,
      from: hourLabel(settings.shiftStart),
      to: hourLabel(end),
    }),
    sourceLine: opts.source ? t.source[opts.source] : "",
    columns: t.columns,
    rows,
    totalRestMin: totals.crewRestMin,
    totalRestLine: t.totalRest(fmt(totals.crewRestMin)),
    bestLine,
    newNote: fresh > 0 ? t.newNote : null,
    notice: t.notice,
    labels: { scan: t.scan, print: t.print, back: t.back, language: t.language, minutes: t.minutes },
  };
}

/** Workload labels are reused by tests to check that both dictionaries cover every key. */
export const SHEET_KEYS = {
  workloads: Object.keys(WORKLOADS) as Workload[],
  clothing: Object.keys(CLOTHING) as Clothing[],
};
