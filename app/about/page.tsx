import type { Metadata } from "next";
import { SceneSlot } from "@/components/scene-slot";
import { Card } from "@/components/ui/card";
import { ACTION_LIMIT, CLOTHING, CLOTHING_KEYS, REST_WATTS, TLV, WORKLOADS, WORKLOAD_KEYS, limitAt } from "@/lib/heat";

export const metadata: Metadata = {
  title: "Method",
  description: "How Calidra computes sun WBGT from Open-Meteo weather and turns it into work/rest minutes.",
};

const STEPS = [
  {
    title: "Hourly weather from Open-Meteo",
    summary: "Temperature, humidity, sunlight, wind, cloud and pressure for the 24 hours of the chosen day.",
    body: "Past days come from the Open-Meteo historical archive (reanalysis), recent and future days from the Open-Meteo forecast. Both are free and keyless, and are called from this site's server when it runs in live mode; in sample mode a stored day profile stands in and the site page says so. Place names are resolved with the Open-Meteo geocoding API.",
  },
  {
    title: "Where the sun is",
    summary: "Solar zenith angle at the middle of each hour, from the NOAA low-precision equations.",
    body: "Open-Meteo reports radiation as the mean of the preceding hour, so the sun is placed half an hour earlier. The share of direct beam versus diffuse light is estimated from how close the measured radiation is to the clear-sky maximum (Liljegren 2008, eq. 13).",
  },
  {
    title: "Globe and natural wet bulb, solved by iteration",
    summary: "Two energy balances, each iterated until it moves less than 0.02 K.",
    body: "The 50.8 mm black globe balances absorbed sunlight and sky radiation against convection to the air. The wetted wick balances the same radiation against evaporative cooling, with heat and mass transfer from cylinder correlations. Wind is brought from 10 m to 2 m with a power law and floored at 0.5 m/s. Equations follow Liljegren et al. (2008); the code is our own.",
  },
  {
    title: "Outdoor WBGT, then the ACGIH curves",
    summary: "WBGT = 0.7 × wet bulb + 0.2 × globe + 0.1 × air, plus a clothing adjustment.",
    body: `For each hour Calidra finds the largest share of work whose time-weighted metabolic rate keeps WBGT under the curve. Rest is assumed at ${REST_WATTS} W. Acclimatized workers use the TLV; workers new this week use the action limit and a NIOSH ramp that caps exposure at 20 percent on day one and adds 20 percent per day.`,
  },
  {
    title: "The shift scan",
    summary: "Every start hour from 04:00 is tried; the one with the most productive crew-minutes wins.",
    body: "Crew-minutes weigh each worker: veterans on the TLV plan, new hires on their shorter plan. The site page shows how many minutes moving the shift would save.",
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-12">
      <div className="calidra-drop grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold sm:text-5xl">How Calidra gets from a forecast to a break schedule</h1>
          <p className="max-w-[66ch] text-muted-foreground">
            The free heat tools most crew leads use rely on the heat index, which is computed for shade and a light breeze.
            OSHA notes that full sun can add up to 15°F and names WBGT as the better measure. Calidra estimates WBGT in the
            sun from standard weather data, hour by hour, without a meter.
          </p>
        </div>
        <Card tone="deep" className="overflow-hidden p-0">
          <SceneSlot
            n={2}
            alt="Cutaway drawing of a black globe thermometer and a wet-wick thermometer side by side under a bright sun, with arrows for sunlight, wind and evaporation"
            width={960}
            height={600}
          />
        </Card>
      </div>

      <section aria-labelledby="steps" className="space-y-4">
        <h2 id="steps" className="text-3xl font-bold">
          Five steps, all in the browser
        </h2>
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <Card className="p-0">
                <details className="group p-5">
                  <summary className="flex cursor-pointer list-none items-start gap-4 [&::-webkit-details-marker]:hidden">
                    <span className="font-display text-2xl font-bold text-gold">{i + 1}</span>
                    <span className="space-y-1">
                      <span className="block font-display text-lg font-semibold">{s.title}</span>
                      <span className="block text-sm text-muted-foreground">{s.summary}</span>
                    </span>
                  </summary>
                  <p className="mt-3 max-w-[70ch] pl-10 text-sm leading-relaxed">{s.body}</p>
                </details>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="limits-table" className="space-y-4">
        <h2 id="limits-table" className="text-3xl font-bold">
          The thresholds in use
        </h2>
        <Card tone="glow" className="overflow-x-auto p-0">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="border-b border-line text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Workload</th>
                <th className="px-5 py-3 font-semibold">Metabolic rate</th>
                <th className="px-5 py-3 font-semibold">TLV, continuous work</th>
                <th className="px-5 py-3 font-semibold">Action limit, new workers</th>
              </tr>
            </thead>
            <tbody>
              {WORKLOAD_KEYS.map((k) => (
                <tr key={k} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">
                    <span className="font-semibold">{WORKLOADS[k].label}</span>
                    <span className="block text-xs text-muted-foreground">{WORKLOADS[k].example}</span>
                  </td>
                  <td className="px-5 py-3">{WORKLOADS[k].watts} W</td>
                  <td className="px-5 py-3">{limitAt(WORKLOADS[k].watts, TLV).toFixed(1)}°C WBGT</td>
                  <td className="px-5 py-3">{limitAt(WORKLOADS[k].watts, ACTION_LIMIT).toFixed(1)}°C WBGT</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="max-w-[70ch] text-sm text-muted-foreground">
          Clothing adjustments added to WBGT:{" "}
          {CLOTHING_KEYS.map((k) => `${CLOTHING[k].label.toLowerCase()} +${CLOTHING[k].cav}°C`).join(", ")}. Curves:
          TLV = {TLV.intercept} − {TLV.slope} log10(M), action limit = {ACTION_LIMIT.intercept} − {ACTION_LIMIT.slope}{" "}
          log10(M), M in watts.
        </p>
      </section>

      <section aria-labelledby="limits" className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="space-y-3 p-6">
          <h2 id="limits" className="text-2xl font-bold">
            Limits we know about
          </h2>
          <ul className="max-w-[68ch] list-disc space-y-2 pl-5 text-sm">
            <li>Weather grids are a few kilometres wide. A dark roof or a reflective slab can run hotter than the model.</li>
            <li>Rest is assumed at the same WBGT as work. Real shade lowers it, so the plan errs on the cautious side.</li>
            <li>Water, individual health and medication are outside the model. A worker with symptoms stops, whatever the plan says.</li>
            <li>Calidra is a screening tool. It does not replace on-site WBGT measurement or an employer heat illness prevention program.</li>
          </ul>
        </Card>
        <Card tone="deep" className="space-y-3 p-6">
          <h2 className="text-2xl font-bold">Sources</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Liljegren, Carhart, Lawday, Tschopp, Sharp (2008). J. Occup. Environ. Hyg. 5(10): 645 to 655.</li>
            <li>ACGIH TLV for heat stress and strain, work/rest curves.</li>
            <li>NIOSH Criteria for a Recommended Standard: Occupational Exposure to Heat and Hot Environments (2016).</li>
            <li>OSHA heat index and WBGT guidance pages.</li>
            <li>NWS Rothfusz heat index regression with its low and high humidity adjustments.</li>
            <li>Open-Meteo forecast, historical and geocoding APIs (CC BY 4.0).</li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
