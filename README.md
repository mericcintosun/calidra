# Calidra

For the lead of an outdoor crew: enter a site, see tomorrow's in-sun heat stress (WBGT) for every hour, how many minutes of each hour to work and to rest, and slide the shift start to find the window that loses the least time.

> Live demo: https://calidra.vercel.app

## The problem

Outdoor workers die from heat every summer, and a large share of those deaths happen in a worker's first days on the job, before the body has adapted. The free tool most crew leads reach for, the OSHA-NIOSH Heat Safety Tool, is built on the heat index. OSHA's own guidance says the heat index is computed for shade and a light wind, that full sun can push the real load up by as much as 15°F, and that WBGT is the better measure. NIOSH also notes that the app is no longer being updated.

So a small subcontractor with no WBGT meter cannot answer the question that matters at 6 a.m.: how many minutes of break does my crew need each hour this afternoon?

## What Calidra does

1. Pulls 24 hours of temperature, humidity, shortwave radiation, wind, cloud and pressure for the site from Open-Meteo. No key, no account.
2. Solves the black globe and natural wet bulb temperatures in the browser with an energy balance after Liljegren et al. (2008), iterating each one until it moves less than 0.02 K, and combines them into outdoor WBGT.
3. Runs every hour against the ACGIH curves for the chosen workload (light 180 W to very heavy 520 W) and clothing, and turns the result into work and rest minutes. Veterans use the TLV. Workers new this week use the action limit plus the NIOSH ramp: 20 percent of a normal exposure on day one, 20 percent more each day.
4. Scans every shift start from 04:00 and reports the one with the most productive crew-minutes. Drag the slider and the rest counter rolls down in real time.
5. Shows the heat index next to WBGT for the same hour, so you can see when "Caution" in the shade means "stop heavy work" in the sun.

Seven of the ten seeded sites replay real heat days from the Open-Meteo archive (Phoenix on 19 July 2023, Houston, the San Joaquin Valley, Andalusia, Delhi, the Çukurova plain, Miami). Three sit in the southern hemisphere, where it is summer now, on tomorrow's live forecast.

## How it uses the required tech

This hackathon has no sponsor SDK. The one hard requirement is a technology project aimed at a real social impact problem, and the heavy lifting is the physics engine in `lib/heat.ts`. The three Open-Meteo APIs are called for real from the first commit, all keyless:

| API | Used for | Code |
| --- | --- | --- |
| Forecast | tomorrow and the next 15 days | `fetchHourly()` in `lib/open-meteo.ts` |
| Historical archive | any past day back to 1950 | `fetchHourly()` picks it for dates older than 6 days |
| Geocoding | place search on `/new` | `searchPlaces()` in `lib/open-meteo.ts` |

If the network fails, each site falls back to its stored day profile and the page says so in a badge.

## Tech stack

- Next.js 15 (App Router), React 19, TypeScript strict
- Tailwind CSS 4 with shadcn-style primitives
- AutoAnimate for the site list, Motion for the rolling rest counter
- Open-Meteo Forecast, Historical and Geocoding APIs
- Deployed on Vercel

## Quickstart

```bash
npm install
npm run dev
# open http://localhost:3000
```

No keys are needed. `npm run build` produces the production bundle; `npm run seed` checks that the 10 seed sites in `lib/data/seed.ts` keep unique, stable ids, and writes nothing.

### Adapter modes

Pages and the `/api/*` routes read data through `getAdapter()` in `lib/adapter.ts`. `ADAPTER_MODE=fake` (the default when unset) serves the seed sites and expands their stored day profiles offline, with a small built-in place list for `/new`. `ADAPTER_MODE=real` calls the Open-Meteo forecast, archive and geocoding APIs from the server and falls back to the seed profile if a call fails. The site page badge says which source is on screen. See `.env.example`.

## Routes

- `/` crew sites, with search, workload and weather filters, and sort, all kept in the URL
- `/site/[slug]` the plan for one site: live hours, settings, shift slider, hour-by-hour strip
- `/new` add a site from a place search and a date
- `/about` the method, the thresholds in use, limits and sources
- `/api/sites`, `/api/sites/[slug]`, `/api/hours`, `/api/places` JSON routes, all returning `{ ok, data, error, source }`

## What we would build next

- A printable crew sheet in English and Spanish with a QR code back to the live plan.
- A validation table: three reference points from the OSHA Outdoor WBGT calculator, locked into tests at ±1°C, with the measured gap published here.
- Shade-aware rest: let the lead mark a shaded rest area and use a lower WBGT for break minutes.
- Shared sites, so a plan made on the lead's phone opens on the foreman's.

## Limits

Calidra is a screening tool. It does not replace on-site WBGT measurement, medical advice or an employer's heat illness prevention program. Weather grids are kilometres wide; a dark roof can run hotter than the model.

## AI use

<!-- Adjust this section to each hackathon's disclosure rules. -->

We used AI coding assistants for scaffolding and boilerplate. Architecture, product decisions, and final code review are our own.

## Credits

Weather data by [Open-Meteo](https://open-meteo.com/) (CC BY 4.0). WBGT method after Liljegren, Carhart, Lawday, Tschopp and Sharp (2008); the code is written from the paper's equations.
