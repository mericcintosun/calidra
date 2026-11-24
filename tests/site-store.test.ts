import { describe, expect, it } from "vitest";
import { parseStoredSites, siteKey, slugify, type SiteKeyInput } from "@/lib/site-store";
import { findSeedSite } from "@/lib/data/seed";

// Pure functions only: no localStorage in the node test environment.

const INPUT: SiteKeyInput = {
  name: "Phoenix replay crew",
  lat: 33.4484,
  lon: -112.074,
  date: "2023-07-19",
  workload: "heavy",
  crewSize: 6,
  newWorkers: 2,
  shiftStart: 7,
};

describe("siteKey", () => {
  it("gives the same key for the same input", () => {
    expect(siteKey(INPUT)).toBe(siteKey({ ...INPUT }));
  });

  it("gives a different key when the crew size changes", () => {
    expect(siteKey({ ...INPUT, crewSize: 7 })).not.toBe(siteKey(INPUT));
  });

  it("makes the same slug from the same input, so a repeat save replaces the row", () => {
    expect(slugify(INPUT.name, siteKey(INPUT))).toBe(slugify(INPUT.name, siteKey(INPUT)));
    expect(slugify(INPUT.name, siteKey(INPUT))).toMatch(/^phoenix-replay-crew-[a-z0-9]+$/);
  });
});

describe("parseStoredSites", () => {
  it("returns an empty list for null, empty and non-JSON input", () => {
    expect(parseStoredSites(null)).toEqual([]);
    expect(parseStoredSites("")).toEqual([]);
    expect(parseStoredSites("not json {")).toEqual([]);
    expect(parseStoredSites('{"slug":"x"}')).toEqual([]);
  });

  it("keeps valid sites and drops garbage entries", () => {
    const site = findSeedSite("phoenix-desert-ridge-framing");
    expect(site).toBeDefined();
    if (!site) return;
    const raw = JSON.stringify([site, null, 42, { slug: "broken" }, "text"]);
    const out = parseStoredSites(raw);
    expect(out).toHaveLength(1);
    expect(out[0].slug).toBe(site.slug);
  });
});
