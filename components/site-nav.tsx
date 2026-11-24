"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Sites" },
  { href: "/new", label: "New site" },
  { href: "/about", label: "Method" },
];

const PANEL_ID = "site-nav-panel";

/**
 * Main nav. The active route gets aria-current="page" and a gold underline. From md up it is
 * one row of links; below md a Menu button opens a panel with the same three links, and the
 * panel closes on every route change.
 */
export function SiteNav() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // A site detail page (and its crew sheet) belongs to the Sites collection.
  const isActive = (href: string) => (href === "/" ? pathname === "/" || pathname.startsWith("/site/") : pathname.startsWith(href));

  const links = (stacked: boolean) =>
    NAV.map((item) => {
      const active = isActive(item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          aria-current={active ? "page" : undefined}
          onClick={() => setOpen(false)}
          className={cn(
            "inline-flex min-h-11 items-center rounded-xl px-3 underline-offset-8 transition-colors hover:bg-deep hover:text-foreground hover:underline hover:decoration-gold",
            stacked && "w-full px-4",
            active ? "bg-deep text-foreground underline decoration-gold" : "text-muted-foreground"
          )}
        >
          {item.label}
        </Link>
      );
    });

  return (
    <>
      <nav aria-label="Main" className="hidden items-center gap-1 text-sm font-medium md:flex">
        {links(false)}
      </nav>
      <Button
        type="button"
        variant="outline" size="icon"
        className="md:hidden"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X aria-hidden /> : <Menu aria-hidden />}
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </Button>
      <nav
        id={PANEL_ID}
        aria-label="Main, small screens"
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-line bg-background px-4 pb-4 pt-2 md:hidden"
      >
        <div className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-2 text-base font-medium shadow-lift">{links(true)}</div>
      </nav>
    </>
  );
}
