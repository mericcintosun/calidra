import { stopHours } from "@/components/site-sort-bar";
import type { SortKey } from "@/lib/data";
import { hourLabel, type SiteSummary } from "@/lib/heat";
import { cn } from "@/lib/utils";

/** LayoutGroup id shared by the collection rows and the detail header, so their layoutIds match. */
export const SITES_LAYOUT_GROUP = "crew-sites";

/**
 * The three real figures of a site, all from summarizeSite in lib/heat.ts: peak sun WBGT,
 * stop-work hours in the shift and crew rest owed. The figure matching the active sort is
 * outlined in ACCENT. Used by the collection row, its quick look and the detail header.
 */
export function SiteFigures({ row, active, size = "sm" }: { row: SiteSummary; active?: SortKey; size?: "sm" | "lg" }) {
  const stops = stopHours(row);
  const items: { key: SortKey; value: string; label: string }[] = [
    { key: "peak", value: `${row.peakWbgtC.toFixed(1)}°C`, label: `peak sun WBGT, ${hourLabel(row.peakHour)}` },
    { key: "stops", value: String(stops), label: stops === 1 ? "stop-work hour in shift" : "stop-work hours in shift" },
    { key: "rest", value: row.crewRestMin.toLocaleString("en-US"), label: "crew-min of rest owed" },
  ];
  return (
    <dl className={cn("grid grid-cols-3", size === "lg" ? "gap-3" : "gap-1.5")}>
      {items.map((i) => {
        const on = i.key === active;
        return (
          <div
            key={i.key}
            className={cn(
              "flex min-w-0 flex-col-reverse justify-end rounded-xl border px-2.5 py-2",
              size === "lg" && "px-4 py-3",
              on ? "border-primary bg-deep" : "border-transparent"
            )}
          >
            <dt className="text-[11px] leading-tight text-muted-foreground">{i.label}</dt>
            <dd className={cn("font-display font-semibold tabular-nums", size === "lg" ? "text-3xl" : "text-lg", on && "text-primary")}>
              {i.value}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
