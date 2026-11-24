import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { SiteNav } from "@/components/site-nav";

/** HEADER row of IDENTITY.md: solid ground, border-b in LINE, sticky. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-semibold tracking-tight">
          <BrandMark />
          Calidra
        </Link>
        {/* Active-route marking needs usePathname, so the nav is a client component. */}
        <SiteNav />
      </div>
    </header>
  );
}
