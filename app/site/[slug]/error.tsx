"use client";

import Link from "next/link";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";

// The site plan failed to render. No error text is shown; details stay in the logs.
export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl">
      <ErrorState
        title="This site plan did not load"
        hint="The hours or the plan could not be built. Try again, or open another crew site."
        onRetry={() => reset()}
      >
        <Button asChild variant="outline">
          <Link href="/">All crew sites</Link>
        </Button>
      </ErrorState>
    </div>
  );
}
