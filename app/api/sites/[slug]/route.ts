import { getAdapter } from "@/lib/adapter";
import type { ApiResponse, Site } from "@/lib/types";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getAdapter().getSite(slug);
  const body: ApiResponse<Site> = site
    ? { ok: true, data: site, error: null, source: "seed" }
    : { ok: false, data: null, error: `No seed site called "${slug}"`, source: "seed" };
  return Response.json(body);
}
