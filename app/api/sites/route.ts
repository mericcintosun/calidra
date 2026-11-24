import { getAdapter } from "@/lib/adapter";
import { statusFor, toApiError } from "@/lib/errors";
import type { ApiResponse, Site } from "@/lib/types";

export async function GET() {
  try {
    const data = await getAdapter().listSites();
    return Response.json({ ok: true, data, error: null, source: "seed" } satisfies ApiResponse<Site[]>);
  } catch (e) {
    const error = toApiError(e);
    return Response.json({ ok: false, data: null, error, source: "seed" } satisfies ApiResponse<Site[]>, {
      status: statusFor(error.error),
    });
  }
}
