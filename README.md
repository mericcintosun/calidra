# Calidra

For the lead of an outdoor crew: enter a site, see tomorrow's in-sun heat stress (WBGT) for every hour, how many minutes of each hour to work and to rest, and slide the shift start to find the window that loses the least time.

> Live demo: https://calidra.vercel.app

## The problem

Outdoor workers die from heat every summer, and a large share of those deaths happen in a worker's first days on the job, before the body has adapted. The free tool most crew leads reach for, the OSHA-NIOSH Heat Safety Tool, is built on the heat index. OSHA's own guidance says the heat index is computed for shade and a light wind, that full sun can push the real load up by as much as 15°F, and that WBGT is the better measure. NIOSH also notes that the app is no longer being updated.

So a small subcontractor with no WBGT meter cannot answer the question that matters at 6 a.m.: how many minutes of break does my crew need each hour this afternoon?

## What Calidra does

1. Pulls 24 hours of temperature, humidity, shortwave radiation, wind, cloud and pressure for the site from Open-Meteo when the deploy runs with `ADAPTER_MODE=real`. No key, no account. The default sample mode expands stored day profiles instead and says so on the page.
2. Solves the black globe and natural wet bulb temperatures in the browser with an energy balance after Liljegren et al. (2008), iterating each one until it moves less than 0.02 K, and combines them into outdoor WBGT.
3. Runs every hour against the ACGIH curves for the chosen workload (light 180 W to very heavy 520 W) and clothing, and turns the result into work and rest minutes. Veterans use the TLV. Workers new this week use the action limit plus the NIOSH ramp: 20 percent of a normal exposure on day one, 20 percent more each day.
4. Scans every shift start from 04:00 and reports the one with the most productive crew-minutes. Drag the slider and the rest counter rolls down in real time.
5. Shows the heat index next to WBGT for the same hour, so you can see when "Caution" in the shade means "stop heavy work" in the sun.

Seven of the ten seeded sites replay real heat days from the Open-Meteo archive (Phoenix on 19 July 2023, Houston, the San Joaquin Valley, Andalusia, Delhi, the Çukurova plain, Miami). Three sit in the southern hemisphere, where it is summer now, on tomorrow's live forecast.

## How it uses the required tech

This hackathon has no sponsor SDK. The one hard requirement is a technology project aimed at a real social impact problem, and the heavy lifting is the physics engine in `lib/heat.ts`. The three Open-Meteo APIs, all keyless, are called from the server when `ADAPTER_MODE=real`; the default fake mode uses the stored day profiles and calls nothing outside. Every call goes through `fetchJson()` in `lib/http.ts` (8 s timeout, one retry for timeouts and 5xx answers) and every answer is checked with a zod schema in `lib/schemas.ts`:

| API | Used for | Code |
| --- | --- | --- |
| Forecast | tomorrow and the next 15 days | `fetchHourly()` in `lib/open-meteo.ts` |
| Historical archive | any past day back to 1950 | `fetchHourly()` picks it for dates older than 6 days |
| Geocoding | place search on `/new` | `searchPlaces()` in `lib/open-meteo.ts` |

If a call fails in real mode, the site falls back to its stored day profile, and the site page says in words that it is showing sample data.

## Tech stack

- Next.js 15 (App Router), React 19, TypeScript strict
- Tailwind CSS 4 with shadcn-style primitives
- AutoAnimate for the site list, Motion for the rolling rest counter
- zod 3 for API query and Open-Meteo response validation
- Vitest 3 for the engine, schema and HTTP helper tests
- Open-Meteo Forecast, Historical and Geocoding APIs
- Deployed on Vercel

## Quickstart

```bash
npm install
npm run dev
# open http://localhost:3000
npm test        # Vitest: heat engine, schemas, HTTP helper
npm run proof   # one live Open-Meteo call plus the test run, written into the Proof section below
```

No keys are needed. `npm run build` produces the production bundle; `npm run seed` checks that the 10 seed sites in `lib/data/seed.ts` keep unique, stable ids, and writes nothing. `npm test` runs offline. `npm run proof` needs network for the live part; without it, it writes a "Not run" line instead of numbers.

## Proof

Written by `npm run proof` (`scripts/proof.mjs`). Live weather: one archive call for Phoenix on 19 Jul 2023 through `lib/open-meteo.ts`, then the WBGT engine, the heavy-work planner and the heat index mismatch search.

<!-- PROOF:BEGIN live-weather -->
Ran on 2026-11-24: one Open-Meteo archive call for Phoenix (33.4484, -112.0740) on 2023-07-19 returned 24 hours in 292 ms, solved to sun WBGT by lib/heat.ts and planned for heavy work. No hour that day reads heat index Caution or lower while sun WBGT says rest or stop.
<!-- PROOF:END live-weather -->

Tests:

<!-- PROOF:BEGIN tests -->
Ran on 2026-11-24 with Vitest: 29 passed, 1 failed, 1 skipped. Failing: demo contract Phoenix seed hours give a mismatch hour through computeHeat, planDay and findMismatch.
<!-- PROOF:END tests -->

### Adapter modes

Pages and the `/api/*` routes read data through `getAdapter()` in `lib/adapter.ts`. `ADAPTER_MODE=fake` (the default when unset) serves the seed sites and expands their stored day profiles offline, with a small built-in place list for `/new`. `ADAPTER_MODE=real` calls the Open-Meteo forecast, archive and geocoding APIs from the server, caches answers (30 minutes for forecasts, 24 hours for archive days and place searches) and falls back to the seed profile if an hours call fails. The site page badge and a plain sentence under it say whether the hours are live or sample data. `/api/*` errors come back as `{ error: { error, hint } }` with a fixed code (`invalid_input`, `upstream_timeout`, `upstream_error`, `parse_failure`, `not_configured`). See `.env.example`.

## Routes

- `/` crew sites, with search, workload and weather filters, and sort, all kept in the URL
- `/site/[slug]` the plan for one site: live hours, settings, shift slider, hour-by-hour strip
- `/new` add a site from a place search and a date
- `/about` the method, the thresholds in use, limits and sources
- `/api/sites`, `/api/sites/[slug]`, `/api/hours`, `/api/places` JSON routes, all returning `{ ok, data, error, source }`

## What we would build next

- A printable crew sheet in English and Spanish with a QR code back to the live plan.
- A validation table: three reference points from the OSHA Outdoor WBGT calculator. The test that reads them is in place (`tests/wbgt-reference.json`, checked at ±1°C); the reference values are entered by hand from the OSHA calculator, then the measured gap goes here.
- Shade-aware rest: let the lead mark a shaded rest area and use a lower WBGT for break minutes.
- Shared sites, so a plan made on the lead's phone opens on the foreman's.

## Limits

Calidra is a screening tool. It does not replace on-site WBGT measurement, medical advice or an employer's heat illness prevention program. Weather grids are kilometres wide; a dark roof can run hotter than the model.

## AI use

<!-- Adjust this section to each hackathon's disclosure rules. -->

We used AI coding assistants for scaffolding and boilerplate. Architecture, product decisions, and final code review are our own.

## Credits

Weather data by [Open-Meteo](https://open-meteo.com/) (CC BY 4.0). WBGT method after Liljegren, Carhart, Lawday, Tschopp and Sharp (2008); the code is written from the paper's equations.
