"use client";

import Link from "next/link";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";

// The crew sheet failed to render. The shell (header, nav, footer) stays; no error text is shown.
export default function CrewSheetError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl">
      <ErrorState
        title="This crew sheet did not load"
        hint="The hours or the QR code could not be prepared. Try again, or go back to the crew sites and open the plan."
        onRetry={() => reset()}
      >
        <Button asChild variant="outline">
          <Link href="/">All crew sites</Link>
        </Button>
      </ErrorState>
    </div>
  );
}
