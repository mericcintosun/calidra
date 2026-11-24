import type { Metadata } from "next";
import { NewSiteForm } from "@/components/new-site-form";
import { SceneSlot } from "@/components/scene-slot";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Plan a site",
  description: "Add a crew site: pick a place and a day, and Calidra fetches the hourly weather and builds the work/rest plan.",
};

export default function NewSitePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="calidra-drop space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold sm:text-5xl">Plan a site</h1>
          <p className="max-w-[62ch] text-muted-foreground">
            Pick the town and the day. Calidra pulls 24 hours of temperature, humidity, sunlight and wind from Open-Meteo,
            saves them with your site, and adds it to the crew sites list in this browser.
          </p>
        </div>
        <NewSiteForm />
      </div>
      <aside className="space-y-4">
        <Card tone="deep" className="overflow-hidden p-0">
          <SceneSlot
            n={3}
            alt="A crew lead holding a printed hourly plan with a colored 24-hour strip, standing beside a pickup truck and a water cooler at a dusty job site"
            width={960}
            height={720}
          />
        </Card>
        <Card className="space-y-2 p-5 text-sm">
          <h2 className="text-xl font-semibold">What happens to your data</h2>
          <p className="text-muted-foreground">
            Only the place search and the weather request leave your browser. They go through this site&apos;s server to
            Open-Meteo, with no key and no account. Sites are saved in localStorage on this device.
          </p>
        </Card>
      </aside>
    </div>
  );
}
