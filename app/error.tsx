"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// No error text is shown to the visitor; the details stay in the server and browser logs.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto flex max-w-xl flex-col items-start gap-4 p-8">
      <p className="font-display text-sm font-semibold text-gold">Calidra</p>
      <h1 className="text-3xl font-bold">This plan did not load</h1>
      <p className="text-muted-foreground">Try again, or go back to the crew sites.</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => reset()}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">All crew sites</Link>
        </Button>
      </div>
    </Card>
  );
}
