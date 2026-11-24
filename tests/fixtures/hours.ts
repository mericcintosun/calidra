// Five fixed hours for the heat engine tests. Values are plausible for each place and time;
// utcMs is the END of the hour, as Open-Meteo reports it (radiation is a preceding-hour mean).

import type { HourlyWeather } from "@/lib/types";

export interface HourFixture {
  name: string;
  lat: number;
  lon: number;
  hour: HourlyWeather;
}

/** Phoenix, 19 Jul 2023, 12:00 to 13:00 MST (UTC-7): hot, dry, clear, sun near its peak. */
export const desertNoon: HourFixture = {
  name: "desert noon",
  lat: 33.4484,
  lon: -112.074,
  hour: {
    local: "2023-07-19T13:00",
    hour: 13,
    utcMs: Date.UTC(2023, 6, 19, 20),
    tempC: 43,
    rh: 12,
    solarWm2: 950,
    windMs: 3,
    cloudPct: 5,
    pressureHpa: 970,
  },
};

/** Houston, 24 Aug 2023, 12:00 to 13:00 CDT (UTC-5): hot, humid, mostly clear. */
export const humidNoon: HourFixture = {
  name: "humid noon",
  lat: 29.7604,
  lon: -95.3698,
  hour: {
    local: "2023-08-24T13:00",
    hour: 13,
    utcMs: Date.UTC(2023, 7, 24, 18),
    tempC: 36,
    rh: 55,
    solarWm2: 880,
    windMs: 3,
    cloudPct: 15,
    pressureHpa: 1010,
  },
};

/** The same Houston hour under full overcast: equal air, humidity and wind, far less sun. */
export const overcastNoon: HourFixture = {
  name: "overcast noon",
  lat: 29.7604,
  lon: -95.3698,
  hour: {
    ...humidNoon.hour,
    solarWm2: 150,
    cloudPct: 100,
  },
};

/** Phoenix, 19 Jul 2023, 02:00 to 03:00 MST: warm night, sun below the horizon. */
export const clearNight: HourFixture = {
  name: "clear night",
  lat: 33.4484,
  lon: -112.074,
  hour: {
    local: "2023-07-19T03:00",
    hour: 3,
    utcMs: Date.UTC(2023, 6, 19, 10),
    tempC: 35,
    rh: 17,
    solarWm2: 0,
    windMs: 2,
    cloudPct: 0,
    pressureHpa: 970,
  },
};

/** New Delhi, 29 May 2024, 14:00 to 15:00 IST (UTC+5:30): very hot, dry, almost no wind. */
export const stillAirAfternoon: HourFixture = {
  name: "still-air hot afternoon",
  lat: 28.5921,
  lon: 77.046,
  hour: {
    local: "2024-05-29T15:00",
    hour: 15,
    utcMs: Date.UTC(2024, 4, 29, 9, 30),
    tempC: 45,
    rh: 12,
    solarWm2: 750,
    windMs: 0.2,
    cloudPct: 10,
    pressureHpa: 980,
  },
};

export const ALL_FIXTURES: HourFixture[] = [desertNoon, humidNoon, overcastNoon, clearNight, stillAirAfternoon];
