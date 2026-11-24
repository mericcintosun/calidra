import { Card } from "@/components/ui/card";

// Static skeleton for the create flow: heading, form panel, side image.
export default function Loading() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]" aria-busy="true">
      <p className="sr-only">Loading the site form</p>
      <div className="space-y-6">
        <div className="h-12 w-2/3 rounded-xl bg-deep" />
        <Card className="flex flex-col gap-5 p-6 sm:p-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 rounded-xl bg-deep" />
              <div className="h-10 w-full rounded-xl bg-deep" />
            </div>
          ))}
        </Card>
      </div>
      <Card tone="deep" className="h-72" />
    </div>
  );
}
