"use client";

import Link from "next/link";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";

// No error text is shown to the visitor; the details stay in the server and browser logs.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl">
      <ErrorState title="This page did not load" hint="Try again, or go back to the crew sites." onRetry={() => reset()}>
        <Button asChild variant="outline">
          <Link href="/">All crew sites</Link>
        </Button>
      </ErrorState>
    </div>
  );
}
