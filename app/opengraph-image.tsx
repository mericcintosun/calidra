import { ImageResponse } from "next/og";

export const alt = "Calidra: sun WBGT work/rest plans for outdoor crews";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// IDENTITY.md D4 velvet palette. Image routes cannot read CSS variables, so the key block hexes live here.
const GROUND = "#171020";
const DEEP = "#291d35";
const LINE = "#3a2a4b";
const INK = "#f0eaf6";
const ACCENT = "#b78df2";
const GOLD = "#e0b84e";
const OK = "#69a56f";
const BAD = "#ef6a5a";

const STRIP = [OK, OK, OK, OK, OK, OK, OK, GOLD, GOLD, BAD, BAD, BAD, BAD, BAD, GOLD, GOLD, OK, OK, OK, OK, OK, OK, OK, OK];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: GROUND, padding: 72, color: INK }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 84, height: 84, borderRadius: 22, background: DEEP, border: `3px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 24, background: ACCENT }} />
          </div>
          <div style={{ fontSize: 64, fontWeight: 700 }}>Calidra</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 54, fontWeight: 700, lineHeight: 1.1, maxWidth: 980 }}>
            Heat index assumes shade. Your crew works in the sun.
          </div>
          <div style={{ fontSize: 28, color: ACCENT, maxWidth: 980 }}>
            Hourly sun WBGT, work/rest minutes and the best shift start for any site.
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {STRIP.map((c, i) => (
            <div key={i} style={{ flex: 1, height: 36, borderRadius: 10, background: c }} />
          ))}
        </div>
      </div>
    ),
    size
  );
}
