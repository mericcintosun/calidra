"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearLocalSites } from "@/lib/site-store";

/**
 * Demo reset. Opening any page with ?demo-reset=1 clears the sites saved in this browser,
 * removes the parameter from the address bar and refreshes the page. Renders nothing.
 * Reads window.location instead of useSearchParams, so no Suspense boundary is needed.
 */
export function DemoReset() {
  const router = useRouter();
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("demo-reset") !== "1") return;
    clearLocalSites();
    url.searchParams.delete("demo-reset");
    const qs = url.searchParams.toString();
    window.history.replaceState(null, "", `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`);
    router.refresh();
  }, [router]);
  return null;
}
