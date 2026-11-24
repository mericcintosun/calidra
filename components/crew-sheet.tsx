"use client";

// Client only for the Print button (window.print) and the browser-saved fallback. The
// language toggle is a pair of plain links, so the sheet and both languages work with
// JavaScript off. Token panels on screen; print: variants switch to white paper and black ink.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { EmptyState, PageSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { STATUS_FILL } from "@/lib/heat";
import { SHEET_DICT, SHEET_LANGS, type CrewSheetData } from "@/lib/print-sheet";
import { findLocalSite } from "@/lib/site-store";
import { cn } from "@/lib/utils";

export function CrewSheet({
  sheet,
  slug,
  query,
  planUrl,
  qrSvg,
}: {
  sheet: CrewSheetData;
  slug: string;
  /** toPlanQuery() of the settings on this sheet, without the leading "?". */
  query: string;
  /** Absolute URL the QR code opens. */
  planUrl: string;
  /** Inline SVG markup from the qrcode package, or null if it could not be made. */
  qrSvg: string | null;
}) {
  const hasNew = sheet.rows.some((r) => r.newWorkMin !== null);
  return (
    <div className="space-y-6 print:space-y-0">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Link
          href={`/site/${slug}?${query}`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {sheet.labels.back}
        </Link>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <nav aria-label={sheet.labels.language} className="flex gap-1 rounded-xl border border-line bg-surface p-1">
            {SHEET_LANGS.map((l) => (
              <Link
                key={l}
                href={`/site/${slug}/print?${query}&lang=${l}`}
                hrefLang={l}
                aria-current={sheet.lang === l ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-3 text-sm font-semibold transition-colors",
                  sheet.lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-deep hover:text-foreground"
                )}
              >
                {SHEET_DICT[l].langName}
              </Link>
            ))}
          </nav>
          <Button type="button" onClick={() => window.print()}>
            <Printer aria-hidden />
            {sheet.labels.print}
          </Button>
        </div>
      </div>

      <article
        lang={sheet.lang}
        className="space-y-6 rounded-2xl border border-line bg-surface p-5 shadow-lift sm:p-8 print:space-y-4 print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black print:shadow-none"
      >
        <header className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] print:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-semibold text-gold print:text-black">{sheet.eyebrow}</p>
            <h1 className="break-words text-3xl font-bold leading-tight sm:text-4xl print:text-2xl" title={sheet.title}>
              {sheet.title}
            </h1>
            <p className="break-words text-sm" title={sheet.placeLine}>
              {sheet.placeLine} · {sheet.dateLine}
            </p>
            <p className="text-sm">{sheet.settingsLine}</p>
            {sheet.sourceLine && <p className="text-sm text-muted-foreground print:text-black">{sheet.sourceLine}</p>}
          </div>
          <figure className="flex flex-col items-center gap-2 justify-self-start md:justify-self-end print:justify-self-end">
            {qrSvg ? (
              <div
                className="size-36 rounded-xl bg-white p-1.5 [&>svg]:h-full [&>svg]:w-full print:size-32 print:p-0"
                role="img"
                aria-label={`${sheet.labels.scan}: ${planUrl}`}
                // The SVG comes from the qrcode package on this server, built from our own URL.
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : null}
            <figcaption className="max-w-[12rem] text-center text-xs">
              <span className="block font-semibold">{sheet.labels.scan}</span>
              <span className="block break-all text-muted-foreground print:text-black" title={planUrl}>
                {planUrl}
              </span>
            </figcaption>
          </figure>
        </header>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] print:grid-cols-2">
          <p className="rounded-xl border border-primary/40 bg-deep p-4 font-display text-lg font-semibold shadow-glow print:border-black print:bg-white print:shadow-none">
            {sheet.totalRestLine}
          </p>
          <p className="rounded-xl border border-line bg-deep p-4 text-sm print:border-black print:bg-white">
            <span className="mr-1.5 inline-block size-2 rounded-full bg-gold align-middle print:hidden" aria-hidden />
            {sheet.bestLine}
          </p>
        </div>

        {/* Wide screens and paper: a table that scrolls inside its own wrapper if it must. */}
        <div className="hidden overflow-x-auto rounded-xl border border-line md:block print:block print:rounded-none print:border-black">
          <table className="w-full min-w-[36rem] text-left text-sm print:min-w-0">
            <thead className="bg-deep text-muted-foreground print:bg-white print:text-black">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold">{sheet.columns.hour}</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">{sheet.columns.wbgt}</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">{sheet.columns.status}</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">{sheet.columns.work}</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">{sheet.columns.rest}</th>
                {hasNew && <th scope="col" className="px-4 py-2.5 text-right font-semibold">{sheet.columns.newWork}</th>}
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map((r) => (
                <tr key={r.hour} className="border-t border-line print:border-black">
                  <th scope="row" className="px-4 py-2 font-display font-semibold">{r.hourLabel}</th>
                  <td className="px-4 py-2 tabular-nums">{r.wbgtC.toFixed(1)}°C</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-2">
                      <span className={cn("size-2.5 shrink-0 rounded-full print:hidden", STATUS_FILL[r.status])} aria-hidden />
                      {r.statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.workMin}</td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">{r.restMin}</td>
                  {hasNew && <td className="px-4 py-2 text-right tabular-nums">{r.newWorkMin}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Below md on screen: one card per hour instead of a wide table. */}
        <ul className="space-y-2 md:hidden print:hidden">
          {sheet.rows.map((r) => (
            <li key={r.hour} className="flex items-center gap-3 rounded-xl border border-line bg-deep p-3 text-sm">
              <span className={cn("h-10 w-1.5 shrink-0 rounded-full", STATUS_FILL[r.status])} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold">
                  {r.hourLabel} · {r.statusLabel}
                </p>
                <p className="text-muted-foreground">
                  {sheet.columns.wbgt} {r.wbgtC.toFixed(1)}°C
                </p>
              </div>
              <dl className="grid grid-cols-[auto_auto] gap-x-2 text-right text-xs">
                <dt className="text-muted-foreground">{sheet.columns.work}</dt>
                <dd className="font-semibold tabular-nums">{r.workMin}</dd>
                <dt className="text-muted-foreground">{sheet.columns.rest}</dt>
                <dd className="font-semibold tabular-nums">{r.restMin}</dd>
                {r.newWorkMin !== null && (
                  <>
                    <dt className="text-muted-foreground">{sheet.columns.newWork}</dt>
                    <dd className="font-semibold tabular-nums">{r.newWorkMin}</dd>
                  </>
                )}
              </dl>
            </li>
          ))}
        </ul>

        {sheet.newNote && <p className="text-sm">{sheet.newNote}</p>}
        <p className="border-t border-line pt-4 text-xs text-muted-foreground print:border-black print:text-black">{sheet.notice}</p>
      </article>
    </div>
  );
}

/**
 * The server could not find this slug through the adapter. Sites made on /new live only in the
 * visitor's browser, so this checks there: a saved site gets a plain "no sheet yet" note, any
 * other address a pointer back to the collection.
 */
export function LocalSheetFallback({ slug }: { slug: string }) {
  const [state, setState] = useState<"loading" | "local" | "missing">("loading");
  useEffect(() => {
    setState(findLocalSite(slug) ? "local" : "missing");
  }, [slug]);

  if (state === "loading") return <PageSkeleton label="Looking for this site in your browser" />;
  if (state === "local")
    return (
      <EmptyState
        title="No crew sheet for this site yet"
        body="A site saved in this browser has no print sheet yet; the sheet prints any of the 10 crew sites in the collection, and the site's own plan stays on its page."
        href="/new"
        cta="Back to New site"
      />
    );
  return (
    <EmptyState
      title="No crew site at this address"
      body="A crew sheet appears here for any site in the collection. Open a site from the list and press Crew sheet to print its plan."
      href="/"
      cta="All crew sites"
    />
  );
}
