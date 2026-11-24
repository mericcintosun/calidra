import { Card } from "@/components/ui/card";

// Static skeleton for a site plan: title, counter panel, settings panel, hour strip.
export default function Loading() {
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
