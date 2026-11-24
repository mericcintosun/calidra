import { Card } from "@/components/ui/card";

// Static skeleton for the method page: heading, image, step list.
export default function Loading() {
  return (
    <div className="space-y-12" aria-busy="true">
      <p className="sr-only">Loading the method</p>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="h-12 w-4/5 rounded-xl bg-deep" />
          <div className="h-4 w-full rounded-xl bg-deep" />
          <div className="h-4 w-3/4 rounded-xl bg-deep" />
        </div>
        <Card tone="deep" className="h-56" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Card key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
