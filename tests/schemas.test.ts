import { describe, expect, it } from "vitest";
import { hoursQuerySchema, openMeteoGeocodeSchema, openMeteoHourlySchema, placesQuerySchema } from "@/lib/schemas";

describe("hoursQuerySchema", () => {
  it("accepts a seed slug alone", () => {
    const r = hoursQuerySchema.safeParse({ slug: "phoenix-desert-ridge-framing", lat: null, lon: null, date: null });
    expect(r.success).toBe(true);
  });

  it("accepts lat and lon with a past date and coerces them to numbers", () => {
    const r = hoursQuerySchema.safeParse({ lat: "33.4484", lon: "-112.074", date: "2023-07-19" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.lat).toBeCloseTo(33.4484, 6);
      expect(r.data.lon).toBeCloseTo(-112.074, 6);
      expect(r.data.date).toBe("2023-07-19");
    }
  });

  it("accepts tomorrow and the archive floor", () => {
    expect(hoursQuerySchema.safeParse({ lat: "-15.6", lon: "-56.1", date: "tomorrow" }).success).toBe(true);
    expect(hoursQuerySchema.safeParse({ lat: "0", lon: "0", date: "1950-01-01" }).success).toBe(true);
  });

  it("rejects a request with neither slug nor both coordinates", () => {
    expect(hoursQuerySchema.safeParse({}).success).toBe(false);
    expect(hoursQuerySchema.safeParse({ lat: "33.4" }).success).toBe(false);
    expect(hoursQuerySchema.safeParse({ lat: "", lon: "" }).success).toBe(false);
  });

  it("rejects coordinates out of range or not numbers", () => {
    expect(hoursQuerySchema.safeParse({ lat: "91", lon: "0" }).success).toBe(false);
    expect(hoursQuerySchema.safeParse({ lat: "0", lon: "-180.5" }).success).toBe(false);
    expect(hoursQuerySchema.safeParse({ lat: "abc", lon: "1" }).success).toBe(false);
  });

  it("rejects a malformed slug", () => {
    expect(hoursQuerySchema.safeParse({ slug: "Bad Slug!" }).success).toBe(false);
    expect(hoursQuerySchema.safeParse({ slug: "a".repeat(81) }).success).toBe(false);
  });

  it("rejects impossible, too old and too far ahead dates", () => {
    expect(hoursQuerySchema.safeParse({ lat: "1", lon: "1", date: "2023-02-30" }).success).toBe(false);
    expect(hoursQuerySchema.safeParse({ lat: "1", lon: "1", date: "1949-12-31" }).success).toBe(false);
    expect(hoursQuerySchema.safeParse({ lat: "1", lon: "1", date: "2099-01-01" }).success).toBe(false);
    expect(hoursQuerySchema.safeParse({ lat: "1", lon: "1", date: "19-07-2023" }).success).toBe(false);
    expect(hoursQuerySchema.safeParse({ lat: "1", lon: "1", date: "yesterday" }).success).toBe(false);
  });
});

describe("placesQuerySchema", () => {
  it("trims and accepts 2 to 80 characters", () => {
    const r = placesQuerySchema.safeParse({ q: "  Cuiabá  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.q).toBe("Cuiabá");
    expect(placesQuerySchema.safeParse({ q: "ab" }).success).toBe(true);
    expect(placesQuerySchema.safeParse({ q: "x".repeat(80) }).success).toBe(true);
  });

  it("rejects too short, blank and too long queries", () => {
    expect(placesQuerySchema.safeParse({ q: "a" }).success).toBe(false);
    expect(placesQuerySchema.safeParse({ q: "   a   " }).success).toBe(false);
    expect(placesQuerySchema.safeParse({ q: "" }).success).toBe(false);
    expect(placesQuerySchema.safeParse({ q: "x".repeat(81) }).success).toBe(false);
    expect(placesQuerySchema.safeParse({}).success).toBe(false);
  });
});

describe("openMeteoHourlySchema", () => {
  const good = {
    utc_offset_seconds: -25200,
    timezone: "America/Phoenix",
    hourly: {
      time: ["2023-07-19T00:00", "2023-07-19T01:00"],
      temperature_2m: [36.1, null],
      relative_humidity_2m: [15, 16],
      shortwave_radiation: [0, 0],
      wind_speed_10m: [2.4, null],
      cloud_cover: [0, 0],
      surface_pressure: [968.2, 968.4],
    },
  };

  it("accepts a well-formed payload with null gaps", () => {
    expect(openMeteoHourlySchema.safeParse(good).success).toBe(true);
  });

  it("rejects malformed payloads", () => {
    expect(openMeteoHourlySchema.safeParse({ ...good, hourly: undefined }).success).toBe(false);
    expect(
      openMeteoHourlySchema.safeParse({ ...good, hourly: { ...good.hourly, temperature_2m: ["hot", "hotter"] } }).success
    ).toBe(false);
    expect(openMeteoHourlySchema.safeParse({ ...good, hourly: { ...good.hourly, time: ["noon", "1pm"] } }).success).toBe(
      false
    );
    expect(openMeteoHourlySchema.safeParse({ error: true, reason: "Parameter start_date is out of range" }).success).toBe(
      false
    );
  });
});

describe("openMeteoGeocodeSchema", () => {
  it("accepts an answer with no results and one with a partial result", () => {
    expect(openMeteoGeocodeSchema.safeParse({ generationtime_ms: 0.4 }).success).toBe(true);
    expect(
      openMeteoGeocodeSchema.safeParse({ results: [{ id: 1, name: "Cuiabá", latitude: -15.6, longitude: -56.1 }] }).success
    ).toBe(true);
  });

  it("rejects results without coordinates", () => {
    expect(openMeteoGeocodeSchema.safeParse({ results: [{ id: 1, name: "Nowhere" }] }).success).toBe(false);
  });
});
