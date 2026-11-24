import { getAdapter } from "@/lib/adapter";
import { hintFor } from "@/lib/errors";
import { siteSlugSchema } from "@/lib/schemas";
import type { ApiResponse, Site } from "@/lib/types";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Same zod boundary as /api/hours and /api/places: a malformed slug never reaches the adapter.
  const parsed = siteSlugSchema.safeParse(slug);
  const site = parsed.success ? await getAdapter().getSite(parsed.data) : undefined;
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
  return Response.json(body, { status: parsed.success ? 404 : 400 });
}
