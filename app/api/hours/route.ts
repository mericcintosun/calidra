import { getAdapter, type HoursInput } from "@/lib/adapter";
import { hintFor, statusFor, toApiError } from "@/lib/errors";
import { hoursQuerySchema } from "@/lib/schemas";
import type { ApiResponse, HourlyResult } from "@/lib/types";

export const dynamic = "force-dynamic";

function invalid(): Response {
  const body: ApiResponse<HourlyResult> = {
    ok: false,
    data: null,
    error: { error: "invalid_input", hint: hintFor("invalid_input") },
    source: "seed",
  };
  return Response.json(body, { status: 400 });
}

// GET /api/hours?slug=phoenix-desert-ridge-framing
// GET /api/hours?lat=33.45&lon=-112.07&date=2023-07-19
// A known seed slug wins over lat and lon so the fake adapter can use the stored profile.
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const parsed = hoursQuerySchema.safeParse({
    slug: sp.get("slug"),
    lat: sp.get("lat"),
    lon: sp.get("lon"),
    date: sp.get("date"),
  });
  if (!parsed.success) return invalid();

  const q = parsed.data;
  const adapter = getAdapter();
  const seed = q.slug ? await adapter.getSite(q.slug) : undefined;

  let input: HoursInput | undefined = seed;
  if (!input) {
    // An unknown slug with no coordinates has nothing to look up.
    if (q.lat === undefined || q.lon === undefined) return invalid();
    input = { lat: q.lat, lon: q.lon, utcOffsetHours: Math.round(q.lon / 15) };
  }
  const date = q.date ?? seed?.date ?? "tomorrow";

  try {
    const data = await adapter.getHours(input, date);
    const body: ApiResponse<HourlyResult> = { ok: true, data, error: null, source: data.source };
    return Response.json(body);
  } catch (e) {
    const error = toApiError(e);
    const body: ApiResponse<HourlyResult> = { ok: false, data: null, error, source: "seed" };
    return Response.json(body, { status: statusFor(error.error) });
  }
}
