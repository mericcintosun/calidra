import { getAdapter } from "@/lib/adapter";
import { hintFor } from "@/lib/errors";
import type { ApiResponse, Site } from "@/lib/types";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getAdapter().getSite(slug);
  if (site) {
    const body: ApiResponse<Site> = { ok: true, data: site, error: null, source: "seed" };
    return Response.json(body);
  }
  const body: ApiResponse<Site> = {
    ok: false,
    data: null,
    error: { error: "invalid_input", hint: hintFor("invalid_input") },
    source: "seed",
  };
  return Response.json(body, { status: 404 });
}
