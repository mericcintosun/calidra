import type { Metadata } from "next";
import { NewSiteForm } from "@/components/new-site-form";
import { SceneSlot } from "@/components/scene-slot";
import { Card } from "@/components/ui/card";
import { getAdapter } from "@/lib/adapter";

export const metadata: Metadata = {
  title: "Plan a site",
  description: "Add a crew site: pick a place and a day, and Calidra builds the hour-by-hour work/rest plan.",
};

export default function NewSitePage() {
  const live = getAdapter().mode === "real";
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="calidra-drop space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold sm:text-5xl">Plan a site</h1>
          <p className="max-w-[62ch] text-muted-foreground">
            Pick a town and a day; Calidra saves the 24 hour plan in this browser.{" "}
            {live
              ? "Hours come from Open-Meteo, or the nearest stored day profile if it does not answer."
              : "This deploy runs in sample mode, so hours come from the nearest stored day profile."}
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
            Only the place search and the weather request leave your browser, and they go to this site&apos;s server.
            {live
              ? " The server asks Open-Meteo, with no key and no account."
              : " In sample mode the server answers from its stored profiles and calls no outside service."}{" "}
            Sites are saved in this browser only, so they do not show on your other devices.
          </p>
        </Card>
      </aside>
    </div>
  );
}
