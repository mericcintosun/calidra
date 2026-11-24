import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <Card className="mx-auto flex max-w-xl flex-col items-start gap-4 p-8">
      <p className="font-display text-sm font-semibold text-gold">Calidra</p>
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-muted-foreground">There is no Calidra page at this address.</p>
      <Button asChild variant="outline">
        <Link href="/">Back to the crew sites</Link>
      </Button>
    </Card>
  );
}
