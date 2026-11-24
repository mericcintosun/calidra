import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

/**
 * Segmented control (shadcn-style primitive): a row of toggle buttons where one is pressed.
 * Plain buttons with aria-pressed inside a labeled group, never a tablist. `indicator` renders
 * behind the pressed segment, so a client caller can pass an animated highlight.
 */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  indicator,
  className,
}: {
  label: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  indicator?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex max-w-full flex-wrap gap-1 rounded-2xl border border-line bg-surface p-1 shadow-lift", className)}
    >
      {options.map((o) => {
        const pressed = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative inline-flex min-h-11 items-center justify-center rounded-xl px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              pressed ? "text-primary-foreground" : "text-muted-foreground hover:bg-deep hover:text-foreground"
            )}
          >
            {pressed && (indicator ?? <span aria-hidden className="absolute inset-0 rounded-xl bg-primary" />)}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export { Segmented };
