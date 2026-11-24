import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

const NAV = [
  { href: "/", label: "Sites" },
  { href: "/new", label: "New site" },
  { href: "/about", label: "Method" },
];

/** HEADER row of IDENTITY.md: solid ground, border-b in LINE, sticky. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-semibold tracking-tight">
          <BrandMark />
          Calidra
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm font-medium">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2 text-muted-foreground underline-offset-8 transition-colors hover:bg-deep hover:text-foreground hover:underline hover:decoration-gold"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
