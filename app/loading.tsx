import { Card } from "@/components/ui/card";

// Static skeleton for the collection: the bento shape, then three rows. No animation.
export default function Loading() {
  return (
    <div className="space-y-16" aria-busy="true">
      <p className="sr-only">Loading crew sites</p>
      <div className="grid gap-3 lg:grid-cols-12">
        <Card className="h-72 lg:col-span-7 lg:row-span-2" />
        <Card tone="deep" className="h-40 lg:col-span-5" />
        <Card tone="deep" className="h-32 lg:col-span-3" />
        <Card tone="deep" className="h-32 lg:col-span-2" />
      </div>
      <div className="space-y-3">
        <div className="h-8 w-48 max-w-full rounded-xl bg-deep" />
        {[0, 1, 2].map((i) => (
          <Card key={i} className="flex flex-col gap-3 p-5">
            <div className="h-5 w-2/5 rounded-xl bg-deep" />
            <div className="h-7 w-full rounded-xl bg-deep" />
          </Card>
        ))}
      </div>
    </div>
  );
}
