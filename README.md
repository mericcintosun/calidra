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
5. Shows the heat index next to WBGT for the same hour, so you can see when a shade reading such as "Caution" or "Extreme caution" means "stop heavy work" in the sun.

Seven of the ten seeded sites replay real heat days from the Open-Meteo archive (Phoenix on 19 July 2023, Houston, the San Joaquin Valley, Andalusia, Delhi, the Çukurova plain, Miami). Three sit in the southern hemisphere, where it is summer now, on tomorrow's live forecast.

## Crew sheet

On any seeded site, press "Crew sheet". `/site/[slug]/print` prints a one-page work/rest plan for the shift: each hour's sun WBGT, plan, work and rest minutes, the new-worker minutes, the rest the crew owes and the best start window. An English and Spanish toggle (two plain links, so it works with JavaScript off) switches every word and keeps every number. A QR code, made on the server with `qrcode`, opens the same plan with the same settings.

The settings live in the URL (`workload`, `clothing`, `crew`, `newWorkers`, `day`, `start`, `hours`), parsed with zod in `lib/plan-params.ts`. Invalid or missing values fall back to the site's own settings. The site page writes its settings back to the address bar as you change them, so a copied link opens the same plan. The QR host comes from `NEXT_PUBLIC_SITE_URL` (default `https://calidra.vercel.app`).

`lib/print-sheet.ts` builds the sheet from `planDay`, `shiftTotals` and `bestStart` with static EN and ES dictionaries; it adds no heat logic. Delete it and DEMO.md step 8 cannot render. Sites saved in a browser from `/new` have no print sheet yet; their print address says so and links back to `/new`.

<!-- PROOF:BEGIN print-sheet -->
Ran on 2026-11-24: lib/print-sheet.ts built the Phoenix sheet (workload=heavy&clothing=workClothes&crew=6&newWorkers=2&day=2&start=5&hours=8) from live archive hours in English and Spanish, 8 shift rows, 1,770 crew-minutes of rest. First row 05:00: "Normal work" / "Trabajo normal". EN: Best window: start at 16:00 (end 00:00) and save 350 crew-minutes of rest. ES: Mejor horario: empezar a las 16:00 (terminar a las 00:00) ahorra 350 minutos por persona de descanso. Same minutes in both languages: yes.
<!-- PROOF:END print-sheet -->

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
- zod 3 for API query, URL plan settings and Open-Meteo response validation
- qrcode 1 for the crew sheet QR code, rendered as SVG on the server
- Vitest 3 for the engine, schema, HTTP helper, browser store, URL settings and crew sheet tests
- Open-Meteo Forecast, Historical and Geocoding APIs
- Deployed on Vercel

## Quickstart

```bash
npm install
npm run dev
# open http://localhost:3000
npm test        # Vitest: heat engine, schemas, HTTP helper, store, URL settings, crew sheet
npm run proof   # live Open-Meteo calls plus the test run, written into the Proof section below
npm run demo:reset  # seed check, then prints the reset URL /?demo-reset=1
```

No keys are needed. The one optional setting besides `ADAPTER_MODE` is `NEXT_PUBLIC_SITE_URL`, the public address the crew sheet QR points to (see `.env.example`). `npm run build` produces the production bundle; `npm run seed` checks that the 10 seed sites in `lib/data/seed.ts` keep unique, stable ids, and writes nothing. `npm test` runs offline. `npm run proof` needs network for the live part; without it, it writes a "Not run" line instead of numbers.

## Proof

Written by `npm run proof` (`scripts/proof.mjs`). Live weather: one archive call for Phoenix on 19 Jul 2023 through `lib/open-meteo.ts`, then the WBGT engine, the heavy-work planner and the heat index mismatch search.

<!-- PROOF:BEGIN live-weather -->
Ran on 2026-11-24: one Open-Meteo archive call for Phoenix (33.4484, -112.0740) on 2023-07-19 returned 24 hours in 313 ms, solved to sun WBGT by lib/heat.ts and planned for heavy work. No hour that day reads heat index Caution or lower while sun WBGT says rest or stop.
<!-- PROOF:END live-weather -->

Demo path: `getHours` timed through `getAdapter()` in real mode for the two demo sites (Phoenix on 19 Jul 2023 and Cuiabá tomorrow), with the source that came back and the heat index band gap hour from `findBandGap`.

<!-- PROOF:BEGIN demo-path -->
Ran on 2026-11-24 through getAdapter() in real mode, cold (no Next.js cache outside the server): Phoenix 2023-07-19: 24 hours from live archive in 71 ms, band gap at 09:00 (heat index Extreme caution, rest); Cuiabá 2026-11-25: 24 hours from live forecast in 179 ms, band gap at 09:00 (heat index Extreme caution, rest). Every call finished under 5 s.
<!-- PROOF:END demo-path -->

Tests:

<!-- PROOF:BEGIN tests -->
Ran on 2026-11-24 with Vitest: 50 passed, 0 failed, 1 skipped.
<!-- PROOF:END tests -->

### Adapter modes

Pages and the `/api/*` routes read data through `getAdapter()` in `lib/adapter.ts`. `ADAPTER_MODE=fake` (the default when unset) serves the seed sites and expands their stored day profiles offline, with a small built-in place list for `/new`. `ADAPTER_MODE=real` calls the Open-Meteo forecast, archive and geocoding APIs from the server, caches hours with `unstable_cache` per place and date (30 minutes for forecasts, 24 hours for archive days; place searches 24 hours through the fetch cache), waits at most 4 s for live hours (`HOURS_BUDGET_MS`), and falls back to the seed profile if an hours call fails or runs over. The site page badge and a plain sentence under it say whether the hours are live or sample data. `/api/*` errors come back as `{ error: { error, hint } }` with a fixed code (`invalid_input`, `upstream_timeout`, `upstream_error`, `parse_failure`, `not_configured`). See `.env.example`.

### Persistence

Sites made on `/new` are saved in the visitor's browser (localStorage), through `lib/site-store.ts` only. The demo needs one small list that is read back in the same browser, so a server store would add a secret and a service for nothing the demo shows. Limit: the list is not shared across devices or browsers, and clearing site data removes it. Each saved site's slug ends in a hash of its inputs (`siteKey`), so saving the same site twice replaces the row instead of adding a second one.

Migrations: none. There is no database and no schema push.

### Demo reset

`npm run demo:reset` runs the seed check and prints the reset URL. Open `/?demo-reset=1` in the demo browser: `components/demo-reset.tsx` clears the sites saved there, removes the parameter and reloads, leaving the 10 seed sites. There is no server store and no chain state, so nothing else needs resetting.

## Routes

- `/` crew sites, with search, workload and weather filters, and sort, all kept in the URL
- `/site/[slug]` the plan for one site: live hours, settings (kept in the URL), shift slider, hour-by-hour strip
- `/site/[slug]/print` the EN/ES crew sheet with a QR code back to the same plan
- `/new` add a site from a place search and a date
- `/about` the method, the thresholds in use, limits and sources
- `/api/sites`, `/api/sites/[slug]`, `/api/hours`, `/api/places` JSON routes, all returning `{ ok, data, error, source }`

## What we would build next

- A crew sheet for sites saved in a browser (today only the seeded sites print).
- A validation table: three reference points from the OSHA Outdoor WBGT calculator. The test that reads them is in place (`tests/wbgt-reference.json`, checked at ±1°C); the reference values are entered by hand from the OSHA calculator, then the measured gap goes here.
- Shade-aware rest: let the lead mark a shaded rest area and use a lower WBGT for break minutes.
- Shared sites, so a plan made on the lead's phone opens on the foreman's.

## Bounties

This hackathon lists no sponsor bounty. All four prizes (First Place, Second Place, Third Place, Honorable Mention) come from one judging ranking, so there is no bounty table.

## Security

No wallet, no account, no API key, no server write route. See `SECURITY.md`.

## Limits

Calidra is a screening tool. It does not replace on-site WBGT measurement, medical advice or an employer's heat illness prevention program. Weather grids are kilometres wide; a dark roof can run hotter than the model.

## AI use

<!-- Adjust this section to each hackathon's disclosure rules. -->

We used AI coding assistants for scaffolding and boilerplate. Architecture, product decisions, and final code review are our own.

## Credits

Weather data by [Open-Meteo](https://open-meteo.com/) (CC BY 4.0). WBGT method after Liljegren, Carhart, Lawday, Tschopp and Sharp (2008); the code is written from the paper's equations.
