import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toString as qrToString } from "qrcode";
import { CrewSheet, LocalSheetFallback } from "@/components/crew-sheet";
import { getAdapter } from "@/lib/adapter";
import { SITE_URL, SLUG_PATTERN } from "@/lib/config";
import { applyPlanParams, parsePlanParams, toPlanQuery } from "@/lib/plan-params";
import { buildSheet, parseLang } from "@/lib/print-sheet";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
  const { slug } = await params;
  const lang = parseLang((await searchParams).lang);
  const site = SLUG_PATTERN.test(slug) ? await getAdapter().getSite(slug) : undefined;
  const label = lang === "es" ? "Hoja de cuadrilla" : "Crew sheet";
  return {
    title: site ? `${label}, ${site.name}, ${site.city}` : label,
    description: site
      ? `Printable ${lang === "es" ? "Spanish" : "English"} work/rest plan for ${site.name} in ${site.city}, with a QR code back to the live plan.`
      : "Printable work/rest plan for a crew site.",
  };
}

/**
 * DEMO.md step 8: the printable EN/ES crew sheet. Same adapter path as the site page (getSite,
 * then getHours), settings from the URL, the QR made here on the server as inline SVG.
 */
export default async function CrewSheetPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  // Not even a well-formed slug: no site can live here, in the adapter or in a browser.
  if (!SLUG_PATTERN.test(slug)) notFound();
  const sp = await searchParams;
  const adapter = getAdapter();
  const site = await adapter.getSite(slug);
  // Well-formed but unknown to the adapter: it may be a site saved in this visitor's browser.
  if (!site) return <LocalSheetFallback slug={slug} />;

  const settings = applyPlanParams(site, parsePlanParams(sp));
  const lang = parseLang(sp.lang);
  const result = await adapter.getHours(site, site.date);
  const sheet = buildSheet(site, result.hours, settings, lang, { date: result.date, source: result.source });
  const query = toPlanQuery(settings);
  const planUrl = `${SITE_URL}/site/${slug}?${query}`;

  let qrSvg: string | null = null;
  try {
    qrSvg = await qrToString(planUrl, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  } catch {
    // The printed URL under the QR spot still opens the same plan.
    qrSvg = null;
  }

  return <CrewSheet sheet={sheet} slug={slug} query={query} planUrl={planUrl} qrSvg={qrSvg} />;
}
