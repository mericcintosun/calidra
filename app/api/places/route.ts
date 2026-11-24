import { getAdapter } from "@/lib/adapter";
import { hintFor, statusFor, toApiError } from "@/lib/errors";
import { placesQuerySchema } from "@/lib/schemas";
import type { ApiResponse, Place } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/places?q=cuiaba
// Fake mode searches the seed cities; real mode asks the Open-Meteo geocoding API.
// The geocoder has no weather source of its own, so real mode reports "forecast".
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const parsed = placesQuerySchema.safeParse({ q: sp.get("q") ?? "" });
  const adapter = getAdapter();
  const source = adapter.mode === "real" ? "forecast" : "seed";
  if (!parsed.success) {
    const body: ApiResponse<Place[]> = {
      ok: false,
      data: null,
      error: { error: "invalid_input", hint: hintFor("invalid_input") },
      source,
    };
    return Response.json(body, { status: 400 });
  }

  try {
    const data = await adapter.searchPlaces(parsed.data.q);
    const body: ApiResponse<Place[]> = { ok: true, data, error: null, source };
    return Response.json(body);
  } catch (e) {
    const error = toApiError(e);
    const body: ApiResponse<Place[]> = { ok: false, data: null, error, source };
    return Response.json(body, { status: statusFor(error.error) });
  }
}
