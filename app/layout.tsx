import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";
import { DemoReset } from "@/components/demo-reset";
import { SiteHeader } from "@/components/site-header";
import { SITE_URL } from "@/lib/config";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const body = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });

const TITLE = "Calidra: sun WBGT work/rest plans for outdoor crews";
// Under 160 characters: the problem, then the fix.
const DESCRIPTION =
  "Heat index assumes shade. Calidra gives outdoor crew leads in-sun WBGT, work/rest minutes for every hour and an EN/ES crew sheet.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s | Calidra" },
  description: DESCRIPTION,
  // The image comes from app/opengraph-image.tsx; the icon from app/icon.svg (file conventions).
  openGraph: { title: TITLE, description: DESCRIPTION, siteName: "Calidra", type: "website", url: "/" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const FOOTER_LINK =
  "inline-flex min-h-11 items-center rounded-xl text-foreground underline decoration-gold/70 underline-offset-4 hover:decoration-primary";
const FOOTER_LINKS = [
  { href: "https://github.com/mericcintosun/calidra", label: "Source on GitHub", external: true },
  { href: "https://devpost.com/hackathons?search=Code%20for%20Change", label: "Code for Change on Devpost", external: true },
  { href: "https://open-meteo.com/", label: "Weather by Open-Meteo (CC BY 4.0)", external: true },
  { href: "/about", label: "Method and limits", external: false },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen antialiased print:bg-white print:text-black">
        <SiteHeader />
        {/* Clears browser-saved sites when the URL has ?demo-reset=1. Renders nothing; outside the header. */}
        <DemoReset />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 print:max-w-none print:p-0">{children}</main>
        <footer className="border-t border-line print:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:px-6">
            <p className="max-w-[70ch]">
              A screening tool, not a substitute for on-site WBGT measurement, medical advice or your employer&apos;s heat
              illness prevention program.
            </p>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-5">
              {FOOTER_LINKS.map((l) =>
                l.external ? (
                  <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className={FOOTER_LINK}>
                    {l.label}
                  </a>
                ) : (
                  <Link key={l.href} href={l.href} className={FOOTER_LINK}>
                    {l.label}
                  </Link>
                )
              )}
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
