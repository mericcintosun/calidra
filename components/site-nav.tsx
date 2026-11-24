"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Sites" },
  { href: "/new", label: "New site" },
  { href: "/about", label: "Method" },
];

/** Main nav. The active route gets aria-current="page" and a gold underline. */
export function SiteNav() {
  const pathname = usePathname() ?? "/";
  // A site detail page belongs to the Sites collection.
  const isActive = (href: string) => (href === "/" ? pathname === "/" || pathname.startsWith("/site/") : pathname.startsWith(href));
  return (
    <nav aria-label="Main" className="flex items-center gap-1 text-sm font-medium">
      {NAV.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-xl px-3 py-2 underline-offset-8 transition-colors hover:bg-deep hover:text-foreground hover:underline hover:decoration-gold",
              active ? "bg-deep text-foreground underline decoration-gold" : "text-muted-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
