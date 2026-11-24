import type { Metadata } from "next";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";
import { DemoReset } from "@/components/demo-reset";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const body = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://calidra.vercel.app"),
  title: { default: "Calidra: sun WBGT work/rest plans for outdoor crews", template: "%s | Calidra" },
  description:
    "For crew leads in construction, farming and landscaping: enter a site and see tomorrow's in-sun heat stress (WBGT) hour by hour, how many minutes to work and rest, and the shift start that loses the least time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen antialiased">
        <SiteHeader />
        {/* Clears browser-saved sites when the URL has ?demo-reset=1. Renders nothing; outside the header. */}
        <DemoReset />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:px-6">
            <p className="max-w-[70ch]">
              Calidra is a screening tool. It does not replace on-site WBGT measurement, medical advice or your
              employer&apos;s heat illness prevention program. Weather data by Open-Meteo (CC BY 4.0).
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
