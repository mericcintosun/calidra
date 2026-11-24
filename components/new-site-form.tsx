"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WORKLOADS, WORKLOAD_KEYS, hourLabel } from "@/lib/heat";
import { isoDate, pickEndpoint } from "@/lib/open-meteo";
import { saveLocalSite, slugify } from "@/lib/site-store";
import type { ApiResponse, HourlyResult, Place, Site, Workload } from "@/lib/types";

type Status = { kind: "idle" } | { kind: "busy"; message: string } | { kind: "error"; message: string };

/** GET an /api/* route and unwrap the shared ApiResponse shape. */
async function getApi<T>(url: string): Promise<{ data: T; source: ApiResponse<T>["source"] }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request answered ${res.status}`);
  const body = (await res.json()) as ApiResponse<T>;
  if (!body.ok || body.data === null) throw new Error(body.error ?? "No data returned");
  return { data: body.data, source: body.source };
}

const SOURCE_NOTE: Record<HourlyResult["source"], string> = {
  archive: "the Open-Meteo historical archive",
  forecast: "the Open-Meteo forecast",
  seed: "the nearest seed day profile (offline mode)",
};

export function NewSiteForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  // Dates come from the visitor's clock, so they are set after hydration.
  const [date, setDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  useEffect(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    setDate((d) => d || isoDate(t));
    t.setDate(t.getDate() + 14);
    setMaxDate(isoDate(t));
  }, []);
  const [workload, setWorkload] = useState<Workload>("heavy");
  const [crewSize, setCrewSize] = useState(6);
  const [newWorkers, setNewWorkers] = useState(1);
  const [shiftStart, setShiftStart] = useState(7);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function find(q = query) {
    if (q.trim().length < 2) return;
    setStatus({ kind: "busy", message: "Searching places…" });
    try {
      const { data: found } = await getApi<Place[]>(`/api/places?q=${encodeURIComponent(q.trim())}`);
      setPlaces(found);
      setStatus(found.length ? { kind: "idle" } : { kind: "error", message: `No place called "${q}" found. Try a nearby city.` });
    } catch (e) {
      setStatus({ kind: "error", message: e instanceof Error ? e.message : "Place search failed" });
    }
  }

  function presetPhoenix() {
    setName("Phoenix replay crew");
    setQuery("Phoenix");
    setDate("2023-07-19");
    setWorkload("heavy");
    setCrewSize(6);
    setNewWorkers(2);
    setShiftStart(7);
    setPlace({ id: 5308655, name: "Phoenix", admin1: "Arizona", country: "United States", latitude: 33.4484, longitude: -112.074, timezone: "America/Phoenix" });
    setPlaces(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!place) {
      setStatus({ kind: "error", message: "Pick a place from the search results first." });
      return;
    }
    setStatus({ kind: "busy", message: `Fetching 24 hours for ${place.name}…` });
    try {
      const qs = new URLSearchParams({ lat: String(place.latitude), lon: String(place.longitude), date });
      const { data: r } = await getApi<HourlyResult>(`/api/hours?${qs.toString()}`);
      if (r.hours.length === 0) throw new Error("No hourly data for that place and date");
      const offsetHours = Math.round(((r.hours[0].utcMs - Date.UTC(...ymdh(r.hours[0].local))) / -3600000) * 2) / 2;
      const crewName = name.trim() || `${place.name} crew`;
      const site: Site = {
        slug: slugify(crewName),
        name: crewName,
        trade: `${WORKLOADS[workload].label} outdoor work`,
        city: place.name,
        region: place.admin1 ?? "",
        country: place.country,
        lat: place.latitude,
        lon: place.longitude,
        utcOffsetHours: offsetHours,
        date: r.date,
        profileDate: r.date,
        mode: r.source === "seed" ? pickEndpoint(r.date) : r.source,
        workload,
        clothing: "workClothes",
        crewSize,
        newWorkers: Math.min(newWorkers, crewSize),
        newWorkerDay: 1,
        shiftStart,
        shiftHours: 8,
        note: `Saved from ${SOURCE_NOTE[r.source]} on ${isoDate(new Date())}.`,
        snapshot: r.hours,
        createdLocally: true,
      };
      saveLocalSite(site);
      router.push(`/?sort=peak`);
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Could not fetch weather" });
    }
  }

  const busy = status.kind === "busy";

  return (
    <Card tone="glow" className="p-6 sm:p-8">
      <form onSubmit={save} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Site details</h2>
          <Button type="button" variant="secondary" size="sm" onClick={presetPhoenix}>
            Fill with Phoenix, 19 Jul 2023
          </Button>
        </div>

        <label className="block space-y-1.5 text-sm">
          <span className="font-semibold">Crew or site name</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Eastside roofing crew" maxLength={60} />
        </label>

        <div className="space-y-2 text-sm">
          <label htmlFor="place" className="font-semibold">
            Where is the work?
          </label>
          <div className="flex gap-2">
            <Input
              id="place"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void find();
                }
              }}
              placeholder="City or town, for example Cuiabá"
            />
            <Button type="button" variant="secondary" onClick={() => void find()} disabled={busy}>
              Find
            </Button>
          </div>
          {place && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-4 text-gold" aria-hidden />
              {place.name}
              {place.admin1 ? `, ${place.admin1}` : ""}, {place.country} ({place.latitude.toFixed(2)}, {place.longitude.toFixed(2)})
            </p>
          )}
          {places && places.length > 0 && (
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {places.map((p) => (
                <li key={p.id}>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto w-full justify-start whitespace-normal py-2 text-left"
                    aria-pressed={place?.id === p.id}
                    onClick={() => {
                      setPlace(p);
                      setPlaces(null);
                    }}
                  >
                    {p.name}
                    {p.admin1 ? `, ${p.admin1}` : ""}, {p.country}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold">Date</span>
            <Input type="date" value={date} max={maxDate || undefined} min="1950-01-01" onChange={(e) => setDate(e.target.value)} required />
            <span className="text-xs text-muted-foreground">Up to 15 days ahead, or any past day back to 1950.</span>
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold">Shift start: {hourLabel(shiftStart)}</span>
            <Input type="number" min={4} max={16} value={shiftStart} onChange={(e) => setShiftStart(Math.min(16, Math.max(4, Number(e.target.value) || 7)))} />
          </label>
        </div>

        <div className="space-y-1.5 text-sm" role="group" aria-label="Workload">
          <p className="font-semibold">How hard is the work?</p>
          <div className="flex flex-wrap gap-1.5">
            {WORKLOAD_KEYS.map((k) => (
              <Button key={k} type="button" size="sm" variant="outline" aria-pressed={workload === k} onClick={() => setWorkload(k)}>
                {WORKLOADS[k].label}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{WORKLOADS[workload].example}.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold">Crew size</span>
            <Input type="number" min={1} max={60} value={crewSize} onChange={(e) => setCrewSize(Math.min(60, Math.max(1, Number(e.target.value) || 1)))} />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold">Started this week</span>
            <Input type="number" min={0} max={crewSize} value={newWorkers} onChange={(e) => setNewWorkers(Math.min(crewSize, Math.max(0, Number(e.target.value) || 0)))} />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? "Working…" : "Fetch weather and save site"}
          </Button>
          {status.kind === "busy" && <Badge variant="outline">{status.message}</Badge>}
          {status.kind === "error" && (
            <p role="alert" className="rounded-xl border border-bad bg-surface px-3 py-2 text-sm">
              {status.message}
            </p>
          )}
        </div>
      </form>
    </Card>
  );
}

function ymdh(local: string): [number, number, number, number] {
  const [d, t] = local.split("T");
  const [y, m, day] = d.split("-").map(Number);
  return [y, m - 1, day, Number(t.slice(0, 2))];
}
