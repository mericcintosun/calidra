import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A native details/summary pair in the velvet direction (shadcn-style primitive). Works with
 * JavaScript off; the one-line summary is a 44 px hit area with the ACCENT focus ring.
 */
function Disclosure({
  summary,
  children,
  className,
  open,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  open?: boolean;
}) {
  return (
    <details open={open} className={cn("group rounded-2xl border border-line bg-surface shadow-lift", className)}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">{summary}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
  );
}

export { Disclosure };
