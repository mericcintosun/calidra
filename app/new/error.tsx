"use client";

import Link from "next/link";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";

// The create flow failed to render. No error text is shown; details stay in the logs.
export default function NewSiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl">
      <ErrorState title="The site form did not load" hint="Try again, or go back to the crew sites." onRetry={() => reset()}>
        <Button asChild variant="outline">
          <Link href="/">All crew sites</Link>
        </Button>
      </ErrorState>
    </div>
  );
}
