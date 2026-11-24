import { getAdapter } from "@/lib/adapter";
import type { ApiResponse, Place } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/places?q=cuiaba
// Fake mode searches the seed cities; real mode asks the Open-Meteo geocoding API.
// The geocoder has no weather source of its own, so real mode reports "forecast".
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 80);
  const adapter = getAdapter();
  const source = adapter.mode === "real" ? "forecast" : "seed";
  try {
    const data = await adapter.searchPlaces(q);
    const body: ApiResponse<Place[]> = { ok: true, data, error: null, source };
    return Response.json(body);
  } catch (e) {
    const error = e instanceof Error ? e.message : "Place search failed";
    const body: ApiResponse<Place[]> = { ok: false, data: null, error, source };
    return Response.json(body);
  }
}
