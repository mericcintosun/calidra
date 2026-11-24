import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * The three screen states every demo route shares: a static skeleton while data loads, an
 * error panel with a retry button, and an empty panel with one next step. Tokens only, round
 * corners, no animation (the skeleton is still, so reduced motion needs nothing extra).
 */

/** Static loading blocks in DEEP on SURFACE. */
export function PageSkeleton({ label = "Loading" }: { label?: string }) {
  return (
    <div className="space-y-6" aria-busy="true">
      <p className="sr-only">{label}</p>
      <div className="space-y-3">
        <div className="h-4 w-48 max-w-full rounded-xl bg-deep" />
        <div className="h-12 w-3/5 rounded-xl bg-deep" />
        <div className="h-4 w-4/5 rounded-xl bg-deep" />
      </div>
      <Card className="flex flex-col gap-4 p-6">
        <div className="h-6 w-2/5 rounded-xl bg-deep" />
        <div className="h-24 w-full rounded-xl bg-deep" />
        <div className="h-10 w-1/3 rounded-xl bg-deep" />
      </Card>
    </div>
  );
}

/** Skeleton in the shape of a site plan: title, counter panel, settings panel, hour strip. */
export function SitePlanSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <p className="sr-only">Loading the site plan</p>
      <div className="space-y-3">
        <div className="h-4 w-56 max-w-full rounded-xl bg-deep" />
        <div className="h-12 w-3/5 rounded-xl bg-deep" />
        <div className="h-4 w-4/5 rounded-xl bg-deep" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <Card className="flex flex-col gap-4 p-6">
          <div className="h-14 w-1/2 rounded-xl bg-deep" />
          <div className="h-3 w-full rounded-xl bg-deep" />
          <div className="h-8 w-2/3 rounded-xl bg-deep" />
        </Card>
        <Card tone="deep" className="h-64" />
      </div>
      <Card className="space-y-4 p-5">
        <div className="h-7 w-40 rounded-xl bg-deep" />
        <div className="h-28 w-full rounded-xl bg-deep" />
      </Card>
    </div>
  );
}

/** Something failed. The button calls onRetry; children add extra actions such as a link home. */
export function ErrorState({
  title,
  hint,
  onRetry,
  retryLabel = "Try again",
  children,
}: {
  title: string;
  hint: string;
  onRetry: () => void;
  retryLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card role="alert" className="flex flex-col items-start gap-3 border-bad/60 p-6">
      <p className="font-display text-sm font-semibold text-gold">Calidra</p>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="max-w-[60ch] text-sm text-muted-foreground">{hint}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onRetry}>
          {retryLabel}
        </Button>
        {children}
      </div>
    </Card>
  );
}

type EmptyAction = { href: string; onAction?: never } | { onAction: () => void; href?: never };

/** Nothing to show yet, plus one next step: a link (href) or a button (onAction). */
export function EmptyState({
  title,
  body,
  cta,
  href,
  onAction,
}: { title: string; body: string; cta: string } & EmptyAction) {
  return (
    <Card className="flex flex-col items-start gap-3 p-6">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <p className="max-w-[60ch] text-sm text-muted-foreground">{body}</p>
      {href ? (
        <Button asChild variant="secondary" size="sm">
          <Link href={href}>{cta}</Link>
        </Button>
      ) : (
        <Button type="button" variant="secondary" size="sm" onClick={onAction}>
          {cta}
        </Button>
      )}
    </Card>
  );
}
