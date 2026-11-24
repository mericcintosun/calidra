import { getAdapter } from "@/lib/adapter";
import type { ApiResponse, Site } from "@/lib/types";

export async function GET() {
  try {
    const data = await getAdapter().listSites();
    return Response.json({ ok: true, data, error: null, source: "seed" } satisfies ApiResponse<Site[]>);
  } catch (e) {
    const error = e instanceof Error ? e.message : "Could not list sites";
    return Response.json({ ok: false, data: null, error, source: "seed" } satisfies ApiResponse<Site[]>);
  }
}
