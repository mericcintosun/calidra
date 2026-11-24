import { getAdapter, type HoursInput } from "@/lib/adapter";
import type { ApiResponse, HourlyResult } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/hours?slug=phoenix-desert-ridge-framing
// GET /api/hours?lat=33.45&lon=-112.07&date=2023-07-19
// A known seed slug wins over lat and lon so the fake adapter can use the stored profile.
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const adapter = getAdapter();
  const slug = sp.get("slug");
  const seed = slug ? await adapter.getSite(slug) : undefined;

  let input: HoursInput | undefined = seed;
  if (!input) {
    const lat = Number(sp.get("lat"));
    const lon = Number(sp.get("lon"));
    if (sp.get("lat") === null || sp.get("lon") === null || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      const body: ApiResponse<HourlyResult> = { ok: false, data: null, error: "Pass slug, or lat and lon", source: "seed" };
      return Response.json(body);
    }
    input = { lat, lon, utcOffsetHours: Math.round(lon / 15) };
  }
  const date = sp.get("date") || seed?.date || "tomorrow";

  try {
    const data = await adapter.getHours(input, date);
    const body: ApiResponse<HourlyResult> = { ok: true, data, error: null, source: data.source };
    return Response.json(body);
  } catch (e) {
    const error = e instanceof Error ? e.message : "Could not load hours";
    const body: ApiResponse<HourlyResult> = { ok: false, data: null, error, source: "seed" };
    return Response.json(body);
  }
}
