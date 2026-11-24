# HANDOFF: Calidra

You are picking up a working Next.js 15 scaffold. Read this file, then `IDENTITY.md`, then start on the Mission list. Keep `npm run build` green after every change.

## 1. Context

**Product:** Calidra. For the lead of an outdoor crew: enter a site, see tomorrow's in-sun heat stress (WBGT) for every hour, how many minutes of each hour to work and to rest, and slide the shift start to find the window that loses the least time.

**Plain pitch:** Someone running a construction, farm or landscaping crew opens the page and types the town where the job is. They pick how heavy the work is and how many people started this week. Tomorrow appears as a colored strip of 24 hours: which hours are normal work, how many minutes of each hour must be shaded rest, and which hours heavy work has to stop. Moving the shift start shows straight away how much lost work time shrinks, and the lead can hand the crew a printable day plan in English and Spanish.

**Hackathon:** Code for Change (Devpost, organized by HackathonForEveryone). Themes: Beginner Friendly, Open Ended, Social Good.
**Deadline:** 1 December 2026, 5:00 pm PST (2 December 01:00 UTC). Aim to submit by 29 November.
**Target track:** First Place ($200 cash). Second, Third and Honorable Mention (recognition awards) come from the same ranking, no extra work.
**Judging:** Impact, Originality, Technical Execution, Presentation; the rules page also names usability. No weights published.

**Submission requirements (verified):**
- A complete Devpost project page with a clear project description
- A demo video or a live demo link
- Source code or build instructions needed to evaluate the project
- Names of all team members
- A new technology project aimed at a real social impact problem, built during the hackathon (from 4 November 2026)
- Eligibility: students only, above the age of majority where they live. Confirm this before submitting.
- Open question: the rules page says winners on 21 November, the dates page says 5 December. Ask the organizer if it matters.

## 2. Current state

Identity: see IDENTITY.md (direction D4, structure S5, archetype L4, kit K7)

### Routes (S5 explorer-detail)

| Route | File | What it shows |
| --- | --- | --- |
| `/` | `app/page.tsx` | L4 bento (6 unequal cells) then the crew site collection with search, filters and sort in the URL |
| `/site/[slug]` | `app/site/[slug]/page.tsx` | One site's plan: live Open-Meteo hours, settings, shift slider, rolling rest counter, best window, hour strip |
| `/new` | `app/new/page.tsx` | Create a site: place search, date, workload, crew. Saves to localStorage and returns to `/` |
| `/about` | `app/about/page.tsx` | Method, threshold table computed from the engine, limits, sources |

All four are linked from the header nav in `components/site-header.tsx` (Sites, New site, Method); `/site/[slug]` is reached from every collection row.

### File map

- `lib/data.ts`: types (`Site`, `HourlyWeather`, `PlanSettings`, `DayProfile`), 10 seed sites, URL filter parsing.
- `lib/heat.ts`: the engine. Solar position, Liljegren globe and natural wet bulb solvers, WBGT, Rothfusz heat index, ACGIH TLV and action limit, NIOSH new-worker ramp, `planDay`, `shiftTotals`, `bestStart`, `findMismatch`, `summarizeSite`.
- `lib/open-meteo.ts`: `fetchHourly()` (forecast or archive, real calls), `searchPlaces()` (geocoding, real), `seedHours()` (offline day-profile expansion).
- `lib/site-store.ts`: localStorage store for sites created on `/new`.
- `components/site-collection.tsx`: the collection, kit signature 1 (AutoAnimate).
- `components/live-strip-cell.tsx`: the bento's live product cell (workload switch on the Phoenix seed) and the status `Legend`.
- `components/plan-view.tsx`: the site detail (`PlanView`), rolling counter via Motion, and `StoredSitePlan` for local sites.
- `components/new-site-form.tsx`: the create flow.
- `components/site-header.tsx`: sticky solid header.
- `components/ui/`: button, card (tones surface, deep, glow), badge (ok, warn, bad, gold), input, range.
- `public/logo.svg`, `app/icon.svg`, `public/illustrations/scene-1..3.svg`, `app/opengraph-image.tsx`: brand pack.

### Real vs mocked

- Real: all three Open-Meteo APIs, the full WBGT physics, the planner and the shift scan.
- Fallback, not mock: `seedHours()` in `lib/open-meteo.ts` expands each seed's stored `DayProfile` into 24 hours. It renders the collection and the first paint of a site page; `PlanView` swaps in live hours on mount and the source badge says which one is on screen.
- Placeholder store: `saveLocalSite()` / `loadLocalSites()` in `lib/site-store.ts` use localStorage (`// TODO: swap for a shared store`).

### Interaction kit K7

- Shipped: signature 1, auto-animated collection. `SiteCollection` uses `useAutoAnimate`; filtering by workload or weather mode, search, and sorting by peak WBGT or rest owed (real computed values) animate rows. Sites created on `/new` appear at the top.
- Remaining (frontend phase):
  2. View morph: wrap the collection and detail in `LayoutGroup` and give each row's title and strip a `layoutId` (`site-${slug}`) so clicking a row morphs it into the detail header.
  3. Inline sort/compare: on `/site/[slug]`, a "worst hours first" toggle that reorders the hour cards by rest minutes, or a two-workload compare that reorders rows by the gap.
- Motion is already imported in `components/plan-view.tsx` (`animate`, `useReducedMotion`).

### One-mark proof (header home link, `components/site-header.tsx`)

```tsx
<Link href="/" className="flex items-center gap-2.5 font-display text-xl font-semibold tracking-tight">
  <BrandMark />
  Calidra
</Link>
```

## 3. Mission (in order)

Status after Phase 1: items 1 to 7 untouched.

1. **Validate the WBGT engine (2 h).** Take three points from the OSHA Outdoor WBGT calculator (hot dry, hot humid, overcast). Add Vitest and `lib/heat.test.ts` that call `computeHeat` and assert within ±1°C. Fix any drift in `lib/heat.ts`. Put the table (inputs, OSHA value, Calidra value, gap) in the README. Done when the test passes and the table is honest, gaps included.
2. **Wow moment polish (2 h).** On `/site/phoenix-desert-ridge-framing`, heavy, 6 crew, 2 new: dragging the slider from 07:00 to 05:00 must visibly roll the rest counter down and the gold "Best window" badge must update. Make the shift window on the hour strip a single outlined band that slides with Motion. Make sure the mismatch line (heat index "Caution" vs WBGT "stop") shows for at least one seeded site and is easy to spot. Rehearse it.
3. **Kit signatures 2 and 3 (2 h).** As described above. Honor `prefers-reduced-motion`.
4. **Hover breakdown (1 h).** In the hour strip, hover or focus shows how much sunlight and wind add to WBGT for that hour (compute WBGT with solar set to 0 and diff it).
5. **Crew sheet: EN/ES print page plus QR (1.5 h).** Add a print stylesheet and a "Print crew sheet" button on the site page; the sheet lists each shift hour with work/rest minutes in English and Spanish, and a QR (add `qrcode`) linking to the live plan URL with settings in the query string. Done when the browser print preview fits on one page.
6. **Settings in the URL (0.5 h).** Site page settings (workload, crew, new, start) mirrored in the query string so a shared link opens the same plan.
7. **Submission (1.5 h).** Deploy to Vercel, record the 90 second video (script below), write the Devpost page from the README, add team names.

### 90 second demo flow

- 0 to 15 s: problem line, then open `/site/phoenix-desert-ridge-framing` (19 July 2023, archive).
- 15 to 45 s: the strip fills; point at an hour where the heat index reads lower than the sun WBGT verdict.
- 45 to 75 s: heavy work, crew 6, 2 new on day 2. Drag shift start 07:00 to 05:00, the counter rolls down, the best window badge updates.
- 75 to 90 s: switch to the Cuiabá site (tomorrow's forecast), show the crew sheet once it exists. Close: "WBGT for every crew lead without a meter, in a browser tab."

## 4. Constraints

- Next.js 15 App Router, TypeScript strict, Tailwind v4 (no config file), shadcn-style primitives in `components/ui/`. Deploys to Vercel: no custom server, no runtime file writes.
- `IDENTITY.md` is law for color, fonts, routes, the home layout and motion. Colors only via the tokens in `app/globals.css`; no raw hex in components (the OG image is the one documented exception, using IDENTITY hexes). Corners stay round (0.75rem and up on cards, panels, controls). One accent glow per screen. Gold only for small details.
- Motion: entrances use the `calidra-drop` keyframe only; every kit import lives in a `"use client"` file; server HTML stays readable with JavaScript off.
- Copy: plain human English. No em or en dashes, no double hyphen dashes. Avoid AI-cliche words (seamless, leverage, empower, robust, unlock, elevate, harness, delve and friends). Numbers over adjectives.
- Keep the safety disclaimer visible: screening tool, not a substitute for on-site measurement or an employer program.
- Scope: if something threatens the 29 November submit target, cut it (QR first, then signature 3) rather than polish.
- Run `npm run build` after every change; it must pass.

## 5. Definition of done

- Live on Vercel at https://calidra.vercel.app and the README demo link works.
- The 90 second flow above works end to end on the seeded sites, with live Open-Meteo data and the offline fallback both tested.
- The wow moment (slider, rolling counter, best window) is rehearsed and recorded.
- README validation table filled with real numbers.
- Devpost page complete with video, repo link and every team member's name; eligibility confirmed.

---

# Phase 1 handover: walking skeleton, adapter seam and demo contract

## Goal

Every step of the 90 second demo has a route that renders from seed data through `getAdapter()` and the `/api/*` handlers, with `ADAPTER_MODE=fake` as the default so the first deploy has no network dependency.

## Status

Done by reading and writing files only; nothing was built or run. Acceptance items, with evidence:

- DEMO.md exists, start route `/` (`DEMO.md:11`); steps name `app/page.tsx`, `app/site/[slug]/page.tsx`, `app/new/page.tsx`, `app/about/page.tsx`, all present.
- CLAUDE.md has the commands (`CLAUDE.md:5-10`), four Vercel guardrails (`CLAUDE.md` section "Vercel guardrails") and the compaction line (last line).
- `lib/adapter.ts:22-24` exports `getAdapter()`, reads `process.env.ADAPTER_MODE`, returns fake unless it equals `"real"`. `lib/adapters/fake.ts` (`fakeAdapter: CalidraAdapter`) and `lib/adapters/real.ts` (`realAdapter: CalidraAdapter`) implement the interface.
- `lib/data/seed.ts` holds the 10 seed sites byte for byte from the old `lib/data.ts`, no `Date.now` or `Math.random`; `scripts/seed.mjs` has neither; `package.json` `"seed": "node scripts/seed.mjs"`.
- Four `loading.tsx` files: `app/loading.tsx`, `app/site/[slug]/loading.tsx`, `app/new/loading.tsx`, `app/about/loading.tsx`. Static blocks, no animation.
- Empty states: `/` shows "No crew sites yet" if the adapter returns no sites (`app/page.tsx`), the collection shows "No site matches those filters." with a "Clear filters" button (`components/site-collection.tsx`), the site page shows "No hourly data for this site yet" when the plan is empty (`components/plan-view.tsx`).
- Title template `"%s | Calidra"` (`app/layout.tsx:11`); `/` uses `title: { absolute: ... }` (`app/page.tsx`); `/new` exports `title: "Plan a site"`, `/about` exports `title: "Method"`. `app/icon.svg` untouched.
- Active nav: `components/site-nav.tsx` (client, `usePathname`) sets `aria-current="page"` plus `bg-deep` and a gold underline; `/site/*` counts as Sites.
- `app/error.tsx` names Calidra, has `reset()` retry and a link to `/`, shows no error text. `app/not-found.tsx` names Calidra and links to `/`.
- API routes `app/api/sites/route.ts`, `app/api/sites/[slug]/route.ts`, `app/api/hours/route.ts`, `app/api/places/route.ts` import `getAdapter` and return `ApiResponse<T>` from `lib/types.ts`, status 200.
- Grep for `fetchHourly|searchPlaces|seedHours` under `app/` and `components/` finds only the method call `adapter.searchPlaces(q)` in `app/api/places/route.ts:14`. Client imports from `@/lib/open-meteo` are the pure helpers `resolveDate` (`components/plan-view.tsx:31`) and `isoDate`, `pickEndpoint` (`components/new-site-form.tsx:11`).
- No `useSearchParams` anywhere, so no Suspense boundary is needed. No runtime `fs` writes. `process.env` keys: `ADAPTER_MODE` (`lib/adapter.ts`), `NEXT_PUBLIC_BRAND_FILES` (`lib/brand-files.ts`), both in `.env.example`.
- Wide elements: hour strip `min-w-[60rem]` sits in `overflow-x-auto` (`components/plan-view.tsx`), thresholds table `min-w-[34rem]` in an `overflow-x-auto` Card (`app/about/page.tsx`). No `w-[Npx]` containers.
- `tsconfig.json:7` `"strict": true`; `.gitignore:4-5` has `.env*` and `!.env.example`.
- SAMENESS TRIPWIRE greps over `app/`, `components/`, `lib/`: dead hex list, banned keyframes, `--delay|--d:`, `backdrop-blur`, em and en dash: no hits. `#[0-9a-fA-F]{6}` hits only `app/opengraph-image.tsx`, `app/globals.css` and `app/icon.svg` (brand file, never touched).

Unverified (needs the runner): `npm run build`, `npm run seed` twice, the Vercel deploy, `/api/sites` JSON on the live URL.

## Decisions

- `CalidraAdapter` has a `mode: "fake" | "real"` field beyond the four methods so `/api/places` can report a source. Geocoding has no weather source, so real mode reports `"forecast"` there.
- Fake `getHours` uses the site's own profile or snapshot when present. For a place with no seed (from `/new`), it borrows the nearest seed site's day profile on the requested date, so `/new` works offline. Its result says `source: "seed"` and the saved site note says "nearest seed day profile (offline mode)".
- Real `getHours` falls back to fake on any throw and then reports `"seed"`, so the badge stays honest.
- `PlanView` takes `initialSource` from the server render, so the badge reads "Source: seed day profile" from the first paint and with JavaScript off. It then refreshes once from `/api/hours` (date resolved in the browser with `resolveDate`). Sites made on `/new` keep their saved snapshot and show "Hours saved with this site" instead of refetching.
- `LiveStripCell` now takes `hours` as a prop from the server page instead of calling `seedHours` itself; the collection uses each local site's `snapshot`.
- The active nav moved into a new client file `components/site-nav.tsx` so `site-header.tsx` and `BrandMark` stay server components. Still one brand mark in the brand link.
- The collection empty state keeps its "Clear filters" button (it resets state and rewrites the URL to `/`) instead of a plain link, because a link to `/` would not reset the client filter state.
- Two copy lines changed because they became untrue: the collection footnote (`components/site-collection.tsx`) and the data note on `/new` (`app/new/page.tsx`), which now says requests go through this site's server.
- `.env.example` lists `# NEXT_PUBLIC_BRAND_FILES=` commented out, since `next.config.ts` sets it at build time.
- `scripts/seed.mjs` checks `slug:` values (the site ids) and any `id:` values; the seed has no `id:` field today.

## Failed attempts

None.

## Files changed

New: `lib/types.ts`, `lib/data/seed.ts`, `lib/adapter.ts`, `lib/adapters/fake.ts`, `lib/adapters/real.ts`, `scripts/seed.mjs`, `app/api/sites/route.ts`, `app/api/sites/[slug]/route.ts`, `app/api/hours/route.ts`, `app/api/places/route.ts`, `app/loading.tsx`, `app/site/[slug]/loading.tsx`, `app/new/loading.tsx`, `app/about/loading.tsx`, `components/site-nav.tsx`, `DEMO.md`, `CLAUDE.md`.

Edited: `lib/data.ts`, `lib/open-meteo.ts`, `package.json`, `.env.example`, `app/page.tsx`, `app/site/[slug]/page.tsx`, `app/layout.tsx`, `app/new/page.tsx`, `app/error.tsx`, `app/not-found.tsx`, `components/plan-view.tsx`, `components/new-site-form.tsx`, `components/site-collection.tsx`, `components/live-strip-cell.tsx`, `components/site-header.tsx`, `README.md`, `HANDOFF.md`.

## Commands run

None, agent has no shell.

## Open questions

- README "How it uses the required tech" still says the Open-Meteo APIs are "called for real from the first commit". True in real mode, dormant in the default fake mode. Rewrite once Phase 2 switches the deploy to real.
- In real mode `/` calls Open-Meteo once per seed site (10 calls) on every request because the page reads `searchParams`. Phase 2 should cache (`next: { revalidate }`) or keep the collection on seed profiles.
- The `/new` page intro still says Calidra "pulls 24 hours ... from Open-Meteo"; in fake mode the hours come from the nearest seed profile. The saved note and badge say so.
- In fake mode the Cuiabá date badge flips from "Tomorrow" to 25 Nov 2026 (the fixed `profileDate`) after the client refresh.
- Not verified that the Phoenix seed shows a heat index "Caution" hour that WBGT calls "stop" (wow moment); that is Mission item 2.
- No new dependency, no `Site` schema change, no new page route, no env variable beyond `ADAPTER_MODE`.
- Builder checklist, manual: confirm eligibility (students only, above the age of majority) and add every team member's name to Devpost.

## Next best step

Phase 2: set up `.farm-live.json`, switch the deploy to `ADAPTER_MODE=real`, add the WBGT validation tests (Vitest, three OSHA points at ±1°C), and add `npm run proof`.

Closing commit message: `faz-1: walking skeleton, adapter seam and demo contract`.

---

# Phase 2 handover: real WBGT engine on live Open-Meteo hours

## Goal

Hourly sun WBGT computed by `lib/heat.ts` from live Open-Meteo data (forecast, archive, geocoding, all keyless), fetched server-side through a timeout, retry and zod boundary, with typed `{ error, hint }` failures, honest sample vs live copy, a Vitest suite and `npm run proof`.

## Status

Written by reading and editing files only; nothing was installed, built, tested or run. Every item below is checked by reading the files, not by execution.

**Which mechanism went real:** `getHours()` in `lib/adapters/real.ts:16-22` calls `fetchHourly()` (`lib/open-meteo.ts:36`), which goes through `fetchJson()` (`lib/http.ts:29`) and `openMeteoHourlySchema` (`lib/open-meteo.ts:47`), then the hours feed `computeHeat`, `planDay` and `findMismatch` on the server render and in `PlanView`. Place search in real mode goes through the same helper and `openMeteoGeocodeSchema` (`lib/open-meteo.ts:88`).

**Still fixtures in both modes:** `listSites()` and `getSite()` serve the 10 seed sites (`lib/adapters/real.ts:14-15` delegate to the fake adapter). Fake mode `getHours()` and `searchPlaces()` stay on seed profiles and the seed city list.

**`.farm-live.json` names no env keys** (`{ "requiredEnv": [], "optionalEnv": [] }`): all three Open-Meteo APIs are keyless, so the only setting, `ADAPTER_MODE`, is a mode switch the runner sets itself, not a secret.

Acceptance gate, agent side (by reading):

- [x] Both adapters implement the unchanged `CalidraAdapter` (`lib/adapter.ts:15-21`); `getAdapter()` selects on `adapterMode()` and defaults to fake (`lib/adapter.ts:23-25`, `lib/config.ts:43-45`).
- [x] `.farm-live.json` valid JSON with both arrays; justified in the sentence above.
- [x] `package.json`: `"test": "vitest run"`, `"proof": "node scripts/proof.mjs"`, `zod ^3.25.76` in dependencies, `vitest ^3.2.4` and `tsx ^4.19.2` in devDependencies. `scripts/proof.mjs` and `scripts/proof-engine.ts` exist.
- [x] Grep README.md and `docs/` for `<PASTE`, `<fill in`, `Paste the`, `placeholder until`, `TBD`: zero hits.
- [x] UI states sample vs live in words: `DataStatement` in `components/plan-view.tsx:389-414`, chosen from `mode` and the load source; it renders above the plan in every state and never hides the hour strip.
- [x] Grep `app/` and `components/` for `adapters/real`, `fetchHourly`, `searchPlaces`, `seedHours`: only the adapter method call `adapter.searchPlaces(...)` in `app/api/places/route.ts:27`.
- [x] `lib/config.ts` holds the three endpoints, `HTTP_TIMEOUT_MS`, `HTTP_RETRIES`, the three revalidate windows, `ARCHIVE_LAG_DAYS`, `LOG_PREFIX` and query limits. Its one env key, `ADAPTER_MODE`, is in `.env.example` with a comment. `process.env.ADAPTER_MODE` appears only at `lib/config.ts:44`.
- [x] `/api/hours` (`app/api/hours/route.ts:23`) and `/api/places` (`app/api/places/route.ts:13`) call `safeParse` right after reading the URL. Schemas are exported from `lib/schemas.ts` and imported by `tests/schemas.test.ts:2`.
- [x] No secret env name, nothing new with `NEXT_PUBLIC_`. No `"use client"` file imports `lib/config.ts`, `lib/http.ts` or `lib/open-meteo.ts`: the date helpers moved to `lib/heat.ts` and the clients import them from there.
- [x] Every outbound fetch is in `lib/http.ts` (`AbortSignal.timeout(HTTP_TIMEOUT_MS)` at line 36, `HTTP_RETRIES + 1` attempts at line 31). No other loop retries.
- [x] Error responses are `{ error: { error, hint } }` with `ErrorCode` from `lib/errors.ts`; status 400 for `invalid_input`, 504 for `upstream_timeout`, 502 otherwise (`statusFor`). Consumers switch on the code: `offlineLabel` in `components/plan-view.tsx`, `placeErrorMessage` and `hoursErrorMessage` in `components/new-site-form.tsx`.
- [x] Log lines use `LOG_PREFIX` with host, status, ms, attempt, counts and lengths only (`lib/http.ts`, `lib/open-meteo.ts`, `lib/adapters/real.ts:20`). No URL, query text or body is logged.
- [x] Imports resolve to repo files or declared dependencies (checked by reading). Seed still has 10 sites (`lib/data/seed.ts` untouched). With `ADAPTER_MODE` unset, `/` and `/site/phoenix-desert-ridge-framing` take the fake path exactly as in Phase 1.
- [x] Stack claims: README lists Next.js 15, React 19, Tailwind 4, zod 3, Vitest 3, matching `package.json`. `/about` no longer says the APIs are called from the browser (`app/about/page.tsx:15`).
- [x] Sameness tripwire over `app/`, `components/`, `lib/`: dead hexes, banned keyframes, `--delay`, `--d:`, `backdrop-blur`, em and en dash: zero hits. No new visual element; header untouched, one brand mark.

Unmet or unverified:

- **Demo contract test likely fails.** `tests/heat.test.ts:158` asserts that the Phoenix seed has a heat index "Caution" hour that WBGT calls rest or stop. By hand: the seed's coolest hour is 35.6°C at 17 percent humidity (`lib/data/seed.ts:30`, `dayShape` gives the minimum at 06:00), and the Rothfusz regression gives about 92°F there, which is "Extreme caution". Every other hour is hotter, so no hour reads "Caution" or lower and `findMismatch` should return undefined. The seed was not tuned (the spec forbids it). The test stays as the contract.
- `npm run build`, `npm test`, `npm run proof`, the Vercel switch to real and the live spot checks: not run (no shell).
- Whether Next's data cache stores fetches that carry an `AbortSignal` is unverified. If it does not, `/` in real mode still makes 10 upstream calls per request; the fix would be `unstable_cache` around `getHours` in `lib/adapters/real.ts`.

## Decisions

- **Keyless real path.** No env key besides `ADAPTER_MODE`; `requiredEnv` is empty.
- **Retry rules.** One retry (`HTTP_RETRIES = 1`) for timeouts, network errors and 5xx. 4xx answers fail at once as `upstream_error`. A non-JSON body is `parse_failure`. A schema miss or fewer than 12 complete hours is `parse_failure`.
- **Seed fallback kept.** Real `getHours` falls back to the fake adapter on any error and logs `[core] real hours failed code=... falling back to seed`; the page then reads "Sample data: ..." plus a line saying the live request did not come back. Real `searchPlaces` has no fallback; its errors reach the form as a code and hint.
- **`ApiResponse.error` shape change.** `string | null` became `ApiError | null` (`{ error: ErrorCode; hint: string }`). Hints are fixed per code in `lib/errors.ts`; no raw message leaves the server. `/api/sites/[slug]` answers 404 with `invalid_input` for an unknown slug.
- **Date window.** `hoursQuerySchema` allows 1950-01-01 to today (UTC) plus 15 days, plus one day so a browser ahead of UTC can still ask for its own "today plus 15".
- **Date helpers moved.** `isoDate` and `resolveDate` moved from `lib/open-meteo.ts` to `lib/heat.ts` (re-exported from `lib/open-meteo.ts`) so client files never pull in the server fetch code. `pickEndpoint` stays server side; `/new` now files a sample-mode site as "archive" when its date is in the past and "forecast" otherwise.
- **Live hours stay labeled live.** If the browser refresh fails after a live server render, `PlanView` keeps the live label instead of switching to "offline".
- **Proof script.** `scripts/proof-engine.ts` prints one `PROOF_JSON {...}` line; `scripts/proof.mjs` runs it and `vitest --reporter=json` in parallel (90 s each, hard stop at 110 s), writes the two README blocks, and exits 0 on every path. Its temporary report lives under `node_modules/.cache/calidra-proof/` and is deleted after reading.

## Failed attempts

None. No error was seen, because nothing could be run.

## Files changed

New: `lib/config.ts`, `lib/errors.ts`, `lib/schemas.ts`, `lib/http.ts`, `vitest.config.ts`, `tests/heat.test.ts`, `tests/schemas.test.ts`, `tests/http.test.ts`, `tests/fixtures/hours.ts`, `tests/wbgt-reference.json`, `scripts/proof.mjs`, `scripts/proof-engine.ts`, `.farm-live.json`, `.farm-commits.json`.

Edited: `lib/types.ts`, `lib/heat.ts`, `lib/open-meteo.ts`, `lib/adapter.ts`, `lib/adapters/real.ts`, `app/api/hours/route.ts`, `app/api/places/route.ts`, `app/api/sites/route.ts`, `app/api/sites/[slug]/route.ts`, `app/page.tsx` (comment only), `app/site/[slug]/page.tsx`, `app/new/page.tsx`, `app/about/page.tsx` (one sentence), `components/plan-view.tsx`, `components/new-site-form.tsx`, `components/site-collection.tsx` (footnote), `package.json`, `.env.example`, `README.md`, `CLAUDE.md`, `HANDOFF.md`.

## Commands run

None. The agent had no shell. Build, install, tests and proof are the runner's and the human's.

## Open questions

- **OSHA reference values.** `tests/wbgt-reference.json` is `[]`, so the OSHA test is skipped with a visible note. Enter three points from the OSHA Outdoor WBGT Calculator (hot dry, hot humid, overcast) as `{ name, tempC, rh, solarWm2, windMs, lat, lon, utc, oshaWbgtC }`; the test then asserts ±1°C. Never invent them.
- **Phoenix mismatch unverified, and probably absent on the seed.** See "Unmet" above. Real archive hours for 19 Jul 2023 are also unlikely to show it: Phoenix that day stayed near or above 32°C all night, and sunny hours are far above the "Caution" band. `npm run proof` will print the real answer. Options for the human: point the wow line at a site where the mismatch exists (a humid morning such as Cuiabá around 08:00 to 09:00 is a candidate by hand estimate, unverified), or change the demo wording to "Extreme caution". Changing `findMismatch` or the seed to force it is out of bounds.
- The bento CTA "Three inputs, real forecast." and the collection intro "Seven real heat days replayed from the archive" describe the days, not the data path; in sample mode they are seed profiles of those days. Not changed this phase.
- In fake mode the Cuiabá date badge still flips from "Tomorrow" to the fixed `profileDate` after the client refresh (Phase 1 note, unchanged).
- Builder checklist, manual: confirm student eligibility; add team names on Devpost.

## Next best step

Run `npm install`, `npm run build`, `npm test`, `npm run proof`, then decide the Phoenix mismatch question above. Then Phase 3: persistence for sites made on `/new`, the EN/ES print sheet with QR, and loading and error screen polish.

---

# Phase 3 handover: demo path on real data, browser persistence, state triad, reset

## Goal

Every DEMO.md step (1 to 7) runs on the real adapter flow with a named fallback, in under 5 s; `demo:reset` returns the browser state to the demo start; step 6 is duplicate-safe and reset-safe; step 2's gap line is true on real hours.

## Status

Written by reading and editing files only. Nothing was installed, built, tested or run. Every item is checked by reading or Grep, not by execution.

Acceptance gate, agent side:

- [x] Every DEMO.md step names a real path file and a fallback file: section "Real path and fallback" in `DEMO.md`. The fallback branch is code in `lib/adapters/real.ts:84` (`return fakeAdapter.getHours(site, date);` inside `realAdapter.getHours`). Step 6 place search has no server fallback; the Phoenix preset (`presetPhoenix` in `components/new-site-form.tsx`) is the documented fallback.
- [x] Persistence only in `lib/site-store.ts`. Grep `localStorage` over `app/`, `components/`, `lib/` hits only `lib/site-store.ts` (lines 1, 2, 67, 119, 140, 147, 164). The copy line on `/new` that said "localStorage" now says "saved in this browser only" (`app/new/page.tsx:43`).
- [x] No runtime `fs` write: Grep `node:fs|from "fs"|writeFile` over `app/`, `components/`, `lib/` finds nothing. `fs` stays in `scripts/` and `next.config.ts` (build time, unchanged).
- [x] No new secret: `.env.example` has no new key, only a comment line that Phase 3 added none; no `NEXT_PUBLIC_` store variable. `.farm-live.json` unchanged.
- [x] `components/states.tsx` exports `PageSkeleton` (line 12), `SitePlanSkeleton` (31), `ErrorState` (57, its Button calls `onRetry` at line 76), `EmptyState` (88, `href` link or `onAction` button). See the state table below.
- [x] `NewSiteForm`: submit `disabled={busy}` (`components/new-site-form.tsx:329`) with `const busy = status.kind === "busy"` (208); `savingRef` guard (91, checked at 119, set at 124, cleared in `finally` at 128); `siteKey(...)` (147) feeds `slugify(crewName, key)` (158); `saveLocalSite(site)` (182) returns `created`, `duplicate` (replace by slug, moved to top) or `failed` with `quota` or `unavailable`.
- [x] `findBandGap` in `lib/heat.ts:331`, used in `components/plan-view.tsx:140`, tested in `tests/heat.test.ts:160` and `:180`. `findMismatch` body (`lib/heat.ts:314-316`) unchanged.
- [x] `components/scene-slot.tsx:1` imports `next/image`; the eslint-disable line is gone. `components/brand-mark.tsx` also moved to `next/image` (it held the last `<img`). Grep `<img` over `app/` and `components/`: no hits.
- [x] `components/plan-view.tsx` has three `useEffect` calls (112, 461, 493). The hours effect (112) makes one fetch, and only when `retry > 0`, no hours came from the server, or in real mode after a seed fallback or a date mismatch (`realNeedsLive`, 114 to 116). No fetch is chained inside another fetch's `.then`.
- [x] `demo:reset` in `package.json`; `scripts/demo-reset.mjs` (spawnSync of `scripts/seed.mjs`, prints `/?demo-reset=1` and the start route); `components/demo-reset.tsx` mounted once in `app/layout.tsx:23`, outside the header. README "Demo reset" and DEMO.md "Reset" document both.
- [x] No new API route and no new page route; `/api/hours` and `/api/places` validation untouched.
- [x] Added imports resolve: `next/cache`, `next/image`, `next/navigation` (from `next`), `zod` (dependency), `@/components/states`, `@/components/demo-reset`, `@/lib/site-store`. Seed untouched, 10 sites.
- [x] Sameness tripwire over `app/`, `components/`, `lib/`: dead hexes, banned keyframes, `--delay`, `--d:`, `backdrop-blur`, em and en dash: no hits. `#[0-9a-fA-F]{6}` only in `app/globals.css`, `app/opengraph-image.tsx`, `app/icon.svg`. No new visual pattern from the ban list. Header untouched, one brand mark.

Unverified (needs the runner or the human): `npm run build`, `npm test`, `npm run proof` (the `demo-path` README block holds an honest "Not run in this build" line until then), the 3 x 7 step walk under 5 s, the duplicate click check on the live URL.

### State triad by route

| Route | File | Skeleton | Error | Empty |
| --- | --- | --- | --- | --- |
| `/` | `app/page.tsx`, `components/site-collection.tsx` | `app/loading.tsx` (`PageSkeleton`) | `app/error.tsx` (`ErrorState` with `reset`, link to `/`) | `app/page.tsx:36` (`EmptyState`, CTA `/new`); `components/site-collection.tsx:115` (`EmptyState` with `onAction` "Clear filters") |
| `/site/[slug]` | `app/site/[slug]/page.tsx`, `components/plan-view.tsx` | `app/site/[slug]/loading.tsx` (`SitePlanSkeleton`); `StoredSitePlan` loading (`PageSkeleton`, plan-view 498) | `app/site/[slug]/error.tsx` (`ErrorState` with `reset`); offline hours: "Retry live hours" button (plan-view 166) | empty plan `EmptyState` (plan-view 309, CTA `/new`); `StoredSitePlan` missing `EmptyState` (plan-view 501) |
| `/new` | `app/new/page.tsx`, `components/new-site-form.tsx` | `app/new/loading.tsx` (`PageSkeleton`) | `app/new/error.tsx` (`ErrorState`); place search and hours errors show "Try again" (re-runs the search or the save) | "No place called ..." panel with a button that fills the Phoenix preset (new-site-form 274) |
| `/about` | `app/about/page.tsx` | `app/about/loading.tsx` (`PageSkeleton`) | root `app/error.tsx` (static page) | not applicable, static content |

## Decisions

- **Store: browser localStorage, wrapped only by `lib/site-store.ts`.** Demo need: "one small mutable state", read in the same browser (steps 6 and 1); client-side variant of that row. Rejected: KV (needs a secret the builder cannot supply; no demo step reads from another device), Postgres (no relational reads), on-chain (nothing to settle). The old TODO is now a documented limit in the file header and README "Persistence": not shared across devices.
- **Idempotency is client side.** There is no server write route, so the check is `siteKey` (djb2 hash of name, lat, lon, date, workload, crew size, new workers, shift start) in the slug plus `saveLocalSite` replacing a record with the same slug, plus the `savingRef` and `disabled` guards against double submit. `slugify` lost its `Date.now()` suffix.
- **Stored data is validated.** `storedSiteSchema` (zod, in `lib/site-store.ts`, mirrors `Site` from `lib/types.ts` without importing server files); `parseStoredSites` drops invalid entries and never throws.
- **Gap line.** `findBandGap` returns, among rest or stop hours, the lowest heat index band, earliest hour on ties. `PlanView` uses `findMismatch(shift) ?? findMismatch(plan) ?? findBandGap(plan)`; the sentence prints the real band, so on the Phoenix seed it reads "Extreme caution" against "stop". The old Phoenix `findMismatch` assertion became a `findBandGap` assertion; `findMismatch` keeps a hand-built "Caution" plus `stop` test.
- **Cache and budget.** `lib/adapters/real.ts` wraps `fetchHourly` in two `unstable_cache` functions (`["calidra-hours", "archive" | "forecast"]` plus the call arguments lat4, lon4, date; revalidate `ARCHIVE_REVALIDATE_S` or `FORECAST_REVALIDATE_S`), after `resolveDate` and `pickEndpoint`. Each call races `HOURS_BUDGET_MS = 4000` (`lib/config.ts`); a timeout logs `[core] real hours failed reason=budget ...` and serves the seed profile. Outside a Next.js server (the proof script), `unstable_cache` throws "incrementalCache missing", so `cachedHours` calls `fetchHourly` directly in that one case.
- **No duplicate client fetch.** `PlanView` takes `initialDate` from `app/site/[slug]/page.tsx` and only refetches in the cases listed above. Fake mode never refetches, which also ends the Cuiabá "Tomorrow" badge flip from the Phase 1 notes.
- **Reset.** `?demo-reset=1` is read from `window.location` (no `useSearchParams`, no Suspense). `clearLocalSites` fires a `calidra:sites-changed` window event that `SiteCollection` listens to, because `router.refresh()` keeps client state and the collection's list would otherwise stay stale until a reload.
- **Scope asks.** No new dependency, env variable, API route or page route was needed.

## Failed attempts

None seen; nothing could be run.

## Files changed

New: `components/states.tsx`, `components/demo-reset.tsx`, `app/site/[slug]/error.tsx`, `app/new/error.tsx`, `scripts/demo-reset.mjs`, `tests/site-store.test.ts`, `.farm-commits.json`.

Edited: `lib/heat.ts`, `lib/site-store.ts`, `lib/config.ts`, `lib/adapters/real.ts`, `components/plan-view.tsx`, `components/new-site-form.tsx`, `components/site-collection.tsx`, `components/scene-slot.tsx`, `components/brand-mark.tsx`, `app/page.tsx`, `app/error.tsx`, `app/loading.tsx`, `app/site/[slug]/loading.tsx`, `app/site/[slug]/page.tsx`, `app/new/loading.tsx`, `app/new/page.tsx` (one copy line), `app/about/loading.tsx`, `app/layout.tsx`, `tests/heat.test.ts`, `scripts/proof-engine.ts`, `scripts/proof.mjs`, `package.json`, `README.md`, `DEMO.md`, `CLAUDE.md`, `.env.example`, `HANDOFF.md`.

## Commands run

None. The agent had no shell.

## Open questions

- Whether `next/cache` imports cleanly under `tsx` (the proof script). If the import fails, the demo-path block reads "Not run in this build: the adapter module could not load outside Next.js", and the live-weather block still runs.
- The "incrementalCache missing" detection in `cachedHours` matches Next 15's error text; if a later Next changes it, the proof script falls back to seed (the live site is unaffected).
- `components/brand-mark.tsx` was changed to `next/image` to meet the no-`<img` rule; it was not in the Phase 3 file list. Check the header mark renders at 28 px.
- Whether the Phoenix live archive day shows a "Caution" hour (unlikely); either way the line now shows a true band through `findBandGap`. `npm run proof` reports it.
- Still open from Phase 2: OSHA reference values in `tests/wbgt-reference.json` (human task), the two bento copy lines about "real forecast" in sample mode.
- Builder checklist, manual: confirm student eligibility; add team names on Devpost.

## Next best step

Phase 4: EN/ES print sheet with QR, plan settings in the URL, hover breakdown, `layoutId` morph and signature 3, landing and OG polish.

Closing commit message: `faz-3: demo path on real data, browser store, state triad and reset`.

---

# Phase 4 working notes

- Current state: 4 routes on the adapter seam, settings live only in `PlanView` state, no print route, nav is one row of three links, no LICENSE or SECURITY.md.
- Phase goal: settings held in the URL, `/site/[slug]/print` EN/ES crew sheet with QR (DEMO step 8), responsive pass at 360/768/1280, landing and share metadata, DELIVERY.md, then the web and wallet security sweep.
- Files to touch: `lib/plan-params.ts`, `lib/print-sheet.ts`, `components/plan-view.tsx`, `components/crew-sheet.tsx`, `app/site/[slug]/page.tsx`, `app/site/[slug]/print/*`, `components/site-nav.tsx`, `components/ui/*`, `app/layout.tsx`, `app/page.tsx`, `lib/config.ts`, proof scripts, tests, README, DEMO, DELIVERY, SECURITY, LICENSE.

# Phase 4 handover: crew sheet with QR, URL-held plan, responsive pass, security sweep

## Goal

DEMO.md step 8: from `/site/phoenix-desert-ridge-framing`, "Crew sheet" opens `/site/[slug]/print` with the tuned settings from the URL, an EN/ES toggle and a QR back to the same plan. Second wow: the crew lead presses one button and gets a Spanish and English one-page work/rest plan whose QR reopens exactly the plan they tuned. Plus the responsive pass, share metadata, DELIVERY.md and the web and wallet security sweep.

Selection reasoning: the unbuilt features from the idea were the EN/ES sheet with QR (1.5 h), the hover breakdown and URL state. The sheet is the most visible in the 90 s script (1:15 to 1:25), needs no new seat or provider, and URL state is its prerequisite, so URL state was built inside this slice. The hover breakdown stays for Phase 5.

## Status

All slices A1 to A5 and B1, B2 were written. Nothing was installed, built, tested or run. Evidence below is from reading the files.

- [x] `lib/plan-params.ts` exports `planParamsSchema`, `parsePlanParams`, `applyPlanParams`, `toPlanQuery`. `components/plan-view.tsx` imports `applyPlanParams, parsePlanParams, toPlanQuery` (import block near the top; `parsePlanParams` is used by `StoredSitePlan` on `window.location.search`). `app/site/[slug]/page.tsx` awaits `searchParams` and calls `parsePlanParams`; no `useSearchParams` anywhere (Grep: only a comment in `components/demo-reset.tsx:10`).
- [x] `PlanView` mirrors settings with `window.history.replaceState(window.history.state, "", ...)` in one effect keyed on the query string; the first render is skipped so a plain link is not rewritten. No `router.push`.
- [x] `app/site/[slug]/print/page.tsx`, `loading.tsx` (`PageSkeleton`), `error.tsx` (`ErrorState`, shell kept) exist. The page imports `buildSheet, parseLang` from `@/lib/print-sheet`, `toString` from `qrcode`, `getAdapter` from `@/lib/adapter`, `SITE_URL, SLUG_PATTERN` from `@/lib/config`. A slug that fails `SLUG_PATTERN` calls `notFound()`; a well-formed slug unknown to the adapter renders `LocalSheetFallback`, which says "A site saved in this browser has no print sheet yet..." with a link to `/new`, or, if the browser has no such site either, "No crew site at this address" with a link to `/`.
- [x] `components/crew-sheet.tsx`: language toggle is two `Link`s to `?...&lang=en|es` (works with JS off), controls row carries `print:hidden`, table in `hidden overflow-x-auto md:block print:block`, card list `md:hidden print:hidden`, all controls `min-h-11`.
- [x] "Crew sheet" button-link in `PlanView` header row (`/site/${site.slug}/print?${query}`), hidden for browser-saved sites. DEMO.md step 8 documents it.
- [x] Depth: `lib/print-sheet.ts` is the only producer of the sheet data; deleting it breaks the print page import. README "Crew sheet" says so.
- [x] `package.json`: only `qrcode ^1.5.4` (dependencies) and `@types/qrcode ^1.5.5` (devDependencies) added. `.env.example` lists `NEXT_PUBLIC_SITE_URL=https://calidra.vercel.app`. `.farm-live.json` unchanged: the new variable is public by design (the deploy's own address) and has a working default, so it is neither a secret nor required.
- [x] `components/site-nav.tsx`: desktop `nav` is `hidden md:flex`; a `md:hidden` button with `min-h-11 min-w-11`, `aria-expanded`, `aria-controls="site-nav-panel"` toggles a `md:hidden` panel with Sites, New site, Method. `useState` only; closes on `pathname` change and on link click; `aria-current` kept.
- [x] Wide elements: hour strip (`min-w-[60rem]` in `overflow-x-auto`, unchanged), `/about` table (`min-w-[34rem]` in its own `overflow-x-auto max-w-full` Card), sheet table (own wrapper plus card list below md), collection rows (one column below lg; name and place `truncate` plus `title`), settings grid (two number inputs, fits 360 px). Site name, place line and the sheet title use `break-words` plus `title`; the QR URL uses `break-all` plus `title`.
- [x] Hit areas: `components/ui/button.tsx` every size is `min-h-11` (sm was `h-8`), `Input` is `h-11`, `Range` is `h-11` with a transparent box around the native track, nav links, back links, the brand link, the bento "Read the method" link, the live strip site link and the `/about` summaries carry `min-h-11`.
- [x] `app/not-found.tsx` and `app/error.tsx` render inside `app/layout.tsx` (root layout wraps both; only a `global-error.tsx` would replace it, and none exists), so header and nav stay.
- [x] Home: the largest cell (`lg:col-span-7 lg:row-span-2`) names Calidra in its paragraph, says what it does and for whom, and has a `Button` link to `/site/phoenix-desert-ridge-framing`. Hrefs on `/`: `/site/${DEMO_SLUG}`, `/new`, `/about`, `/site/${slug}` (rows), all route files. The two "real forecast" lines now read from `adapter.mode`.
- [x] `app/layout.tsx`: `metadataBase` from `SITE_URL`, title default plus `%s | Calidra`, 129 character `description`, `openGraph` (title, description, siteName, type website, url), `twitter.card: "summary_large_image"`. `app/opengraph-image.tsx` (untouched, never-touch list) returns `ImageResponse` with `size = { width: 1200, height: 630 }`. `app/icon.svg` untouched and picked up by the file convention. Site and print pages export titles with the site name.
- [x] Hex grep `#[0-9a-fA-F]{3,8}` over `app/`, `components/`, `lib/`: only `app/globals.css` and `app/opengraph-image.tsx`. The QR tile uses Tailwind `bg-white` (needed for scanning) and the print variants use `print:bg-white print:text-black print:border-black`; no new hex. `console.log|debug|info` in `app/`, `components/`, `lib/`: only the `[core]` server lines in `lib/http.ts` and `lib/open-meteo.ts`.
- [x] README: "Bounties" with the exact sentence, "Crew sheet" section with `<!-- PROOF:BEGIN print-sheet -->` / `<!-- PROOF:END print-sheet -->` (honest "Not run" line until the runner runs `npm run proof`), "Security" pointer, stack line adds `qrcode 1` (in `package.json`); Next 15, React 19, Tailwind 4, zod 3, Vitest 3 match `package.json` majors.
- [x] `DELIVERY.md`: headings `First Place`, `Second Place`, `Third Place`, `Honorable Mention`; watch steps 2, 4, 4, 8, all present in DEMO.md (steps 1 to 8); before-submitting list. `LICENSE` (MIT) created, it was missing.
- [x] `SECURITY.md` has the four sections. Footer line in `app/layout.tsx` with `target="_blank" rel="noopener noreferrer"`.
- [x] Sameness greps over `app/`, `components/`, `lib/`: dead hexes, `fade-up|float-y|glow-pulse|caret-blink|pulse-dot`, `--delay|--d:`, `backdrop-blur`: zero hits. `<BrandMark`: one hit, `components/site-header.tsx:11`. Em dash, en dash, double hyphen and banned words over every file this phase wrote: zero hits.
- [x] Imports checked by reading: `qrcode` (added), `lucide-react` `Menu`, `X`, `Printer`, `ArrowLeft`, `ArrowUpRight`; every `@/` path points to an existing file. Seed untouched, 10 sites.

Unverified (runner and human): `npm install`, `npm run build` (incl. `@types/qrcode` named import `toString`), `npm test` (new suites `tests/plan-params.test.ts`, `tests/print-sheet.test.ts`), `npm run proof`, the deploy, QR scan, print preview fitting one page, 360/768/1280 checks, Lighthouse.

## Decisions

- **Seventh URL key `hours`.** The spec lists six keys; shift length is also a setting the lead tunes, so `hours` (6, 8 or 10) rides along. Without it the QR could reopen a different shift.
- **Overrides vs settings.** `parsePlanParams` returns only valid keys; `applyPlanParams(defaults, overrides)` does the cross-field rules (new workers capped at crew, start must fit 04:00 to 24 minus shift length, else the site's start). Each key is parsed on its own, so one bad value never drops the others.
- **Unknown vs saved slug.** The server cannot read localStorage, so a malformed slug is `notFound()` and a well-formed unknown slug goes to a small client check (`LocalSheetFallback`) that words both cases. The "Crew sheet" button is hidden for browser-saved sites, so the demo never leads to that empty state.
- **Rows.** The sheet lists the shift hours only (not 24), so it fits one printed page.
- **Spanish wording.** Static dictionary in `lib/print-sheet.ts`; "minutos por persona" for crew-minutes. Worth one read by a native speaker before the video.
- **Print styling.** `print:` variants only, no `@media print` block in `app/globals.css`. Header and footer carry `print:hidden`; `body` and the sheet switch to white and black on paper.
- **Touch targets globally.** Changed the `Button` size scale (all `min-h-11`) instead of patching each call site, so chips and settings buttons are taller on desktop too.
- **`/api/sites/[slug]`** had no zod check; added `siteSlugSchema` (`lib/schemas.ts`), 400 for a malformed slug, 404 for an unknown one.
- **`/about` heading** "Five steps, all in the browser" became "Five steps from weather to break minutes" (the engine runs on the server for page renders too). The bento physics line likewise says "by Calidra's own engine".
- **Env.** One new public variable, `NEXT_PUBLIC_SITE_URL`, read only by `SITE_URL` in `lib/config.ts` (fallback `https://calidra.vercel.app`), also used for `metadataBase`. No new secret, so `.farm-live.json` is unchanged.

### Security sweep (B1, B2)

- Key-like strings (`sk-...`, `PRIVATE_KEY`, 64-hex, 40+ char base64) in `app/`, `components/`, `lib/`, `scripts/`: none.
- `target="_blank"`: one, the new footer link, with `rel="noopener noreferrer"`.
- `http://` in app code: none. Noted exceptions: the SVG `xmlns` in `app/icon.svg` and a localhost example in the console output of `scripts/demo-reset.mjs` (not app code).
- Forms: `components/new-site-form.tsx` fetches only `/api/places` and `/api/hours`, then saves through `lib/site-store.ts`. `components/plan-view.tsx` fetches only `/api/hours`. Open-Meteo is named on `/about`, `/new`, `/`, the site page source badge and the footer.
- `useSearchParams`: absent. `fs` writes in `app/`, `components/`, `lib/`: none. `process.env` reads: `ADAPTER_MODE`, `NEXT_PUBLIC_SITE_URL` (`lib/config.ts`), `NEXT_PUBLIC_BRAND_FILES` (`lib/brand-files.ts`), all in `.env.example`.
- `/api/hours` and `/api/places` call `safeParse` first; `/api/sites/[slug]` now too; `/api/sites` takes no input. No route holds a secret or logs a request body.
- Contract front skipped: `contracts/` does not exist. Wallet front vacuous: Grep for `eth_requestAccounts|ethereum|wagmi|viem|ethers|personal_sign|eth_sign` over the repo (excluding `node_modules`, `.git`, `.next`) returned zero hits before `SECURITY.md` was written. No Blockaid warning is expected, since no wallet code exists.
- Nothing parked; no finding left unfixed.

## Failed attempts

None seen; nothing could be run.

## Files changed

New: `lib/plan-params.ts`, `lib/print-sheet.ts`, `components/crew-sheet.tsx`, `app/site/[slug]/print/page.tsx`, `app/site/[slug]/print/loading.tsx`, `app/site/[slug]/print/error.tsx`, `tests/plan-params.test.ts`, `tests/print-sheet.test.ts`, `DELIVERY.md`, `SECURITY.md`, `LICENSE`, `.farm-commits.json`.

Edited: `app/site/[slug]/page.tsx`, `components/plan-view.tsx`, `lib/config.ts`, `lib/schemas.ts`, `.env.example`, `package.json`, `scripts/proof-engine.ts`, `scripts/proof.mjs`, `components/site-nav.tsx`, `components/site-header.tsx`, `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/range.tsx`, `components/live-strip-cell.tsx`, `components/site-collection.tsx`, `app/about/page.tsx`, `app/page.tsx`, `app/layout.tsx`, `app/api/sites/[slug]/route.ts`, `README.md`, `DEMO.md`, `HANDOFF.md`.

## Commands run

None. The agent had no shell.

## Open questions

- `qrcode` is CommonJS; the print page uses the named import `toString`. If the build rejects it, switch to `import QRCode from "qrcode"` and `QRCode.toString(...)` (esModuleInterop is on).
- Print preview fitting one page is unchecked: 8 rows plus header and QR should fit A4 and Letter; a 10 h shift adds two rows.
- `LICENSE` copyright line says "Meric" (the git user); change it to the team's names if needed.
- `CLAUDE.md` still lists the old test files and two env keys; it was outside this phase's fence. Add `tests/plan-params.test.ts`, `tests/print-sheet.test.ts` and `NEXT_PUBLIC_SITE_URL` next phase.
- Still open from earlier phases: OSHA reference values in `tests/wbgt-reference.json` (human task); student eligibility and team names (DELIVERY.md list).

## Unmet against the spec

- "An unknown slug calls `notFound()`" holds only for malformed slugs; a well-formed unknown slug shows the written "No crew site at this address" panel with status 200, because the server cannot tell it from a browser-saved site.
- Nothing else is known unmet by reading. Every runtime check is unverified, as listed above.

## Next best step

Phase 5, the frontend pass: `layoutId` morph (signature 2), signature 3 (the sort/compare control), the hover breakdown, final polish.

---

# Phase 5 handover: frontend pass, bento scene and submission package

## Goal

The 90 s demo (DEMO.md steps 1 to 8) runs on a finished-looking product: signature 2 (`layoutId` morph), signature 3 (sort control), the hour hover breakdown, scene slots on every route, and the submission files (README, SUBMISSION.md, docs/SCREENSHOTS.md).

## Status

Written by reading and editing files only. Nothing was installed, built, tested or run. **No live deployment existed and no screenshots were available, so the whole diagnosis was made from the source files.** Every item below is checked by reading or Grep.

- [x] Primitives: new `components/ui/segmented.tsx` (group of `aria-pressed` buttons, not a tablist, optional `indicator` slot) and `components/ui/disclosure.tsx` (styled details/summary). The nav's bare `<button>` is now `Button variant="outline" size="icon"` (`components/site-nav.tsx`). Grep `<button|<input|<select` over `app/` and `components/`: only `components/ui/input.tsx`, `components/ui/range.tsx`, `components/ui/segmented.tsx`.
- [x] Home L4 (`app/page.tsx`): six cells at lg, cols x rows: claim 7x2, image (scene 1) 5x1, CTA 3x1, sun gap 2x1, live product 8x1, method 4x1. All pairwise different; the claim (h1) sits in the largest cell (area 14). One primary Button on the page: "Compare the crew sites" (`href="#sites"`, DEMO step 1); "Plan your own site" is `variant="outline"`. No copy above the grid. The gold eyebrow became muted ink with a 6 px gold dot.
- [x] One glow per screen: `/` CTA cell, `/site/[slug]` counter card, `/new` form card, `/about` scene 2 card (the threshold table card moved to `deep` because it now folds closed).
- [x] Footer (`app/layout.tsx`): one sentence (screening disclaimer) plus four links: GitHub repo, Code for Change on Devpost, Open-Meteo, `/about`.
- [x] Simplification: `/about` intro one sentence, steps in `Disclosure`, threshold table behind "Show the threshold table for all four workloads" with one sentence above it computed from the engine; `/new` intro one sentence plus the mode sentence; collection footnote one sentence; claim cell one sentence.
- [x] Signature 1 kept: `useAutoAnimate` at `components/site-collection.tsx` (import line 5).
- [x] Signature 2: `layoutId` in `components/site-collection.tsx` (row and quick look) and `components/plan-view.tsx` (header `motion.h1` and figure block), all inside `LayoutGroup id={SITES_LAYOUT_GROUP}` from `components/site-figures.tsx`.
- [x] Signature 3: `components/site-sort-bar.tsx` (`SiteSortBar`, `sortRows`, `stopHours`), Motion `layoutId="site-sort-indicator"` highlight; sort keys `peak | stops | rest | name` in `lib/types.ts`, parsed by `parseFilters` in `lib/data.ts`, written to the URL by `update()` in the collection. The active figure is outlined in every row by `SiteFigures` (`components/site-figures.tsx`).
- [x] Hover breakdown: `HourBreakdown` in `components/plan-view.tsx`, a `Card` with `id="hour-breakdown"` (`BREAKDOWN_ID`) and `role="tooltip"`, opened by `onMouseEnter` and `onFocus` on each hour `Button`, closed by leave, blur or Escape; the open column carries `aria-describedby`. Values are `HourPlan` fields: air, humidity, sunlight, wind at 2 m, heat index and band, sun WBGT, status, veteran and new-worker work/rest minutes.
- [x] Live cell (`components/live-strip-cell.tsx`): `motion.div layout` expands on hover or focus inside (taller bars, labels every 3 h, a readout of the peak hour, the stop-work hours and the best start from `bestStart`).
- [x] Every file importing `motion/react` or `@formkit/auto-animate/react` starts with `"use client"`: `components/live-strip-cell.tsx`, `components/plan-view.tsx`, `components/site-collection.tsx`, `components/site-sort-bar.tsx`.
- [x] Reduced motion: every `layout` and `layoutId` is `undefined` or `false` when `useReducedMotion()` is true; the CSS block at `app/globals.css:129` covers `.calidra-drop` and `.calidra-drop-group > *`; AutoAnimate follows the OS setting by default. No server-rendered `opacity-0`; the popover and the expanded readout are absent from server HTML, not hidden.
- [x] Motion system: `.calidra-drop-group` now on the bento, the `PlanView` root (header, plan grid, hour card stagger) and the `/about` root; `/new` keeps `.calidra-drop`. One keyframe block.
- [x] Sameness greps over `app/` and `components/` (counts in `.farm-delta.md`): dead hexes and banned keyframes 0, `role="tablist"` 0, `animate-pulse` 0, `--delay|--d:` 0, `backdrop-blur` 0, `mask-image` 0, `Reveal|CopyChip` 0, `font-mono` 0.
- [x] Brand link unchanged: one `<BrandMark />` inside the header Link.
- [x] README, SUBMISSION.md, docs/SCREENSHOTS.md written; bounty table rows are "First Place | $ 200 in cash" and "Runner-up recognition award." for Second, Third, Honorable Mention. Grep for `<PASTE|Paste the|TBD|placeholder until|ADD_VIDEO_URL|video` in README.md, SUBMISSION.md and docs/: 0. Banned words and dash characters: 0.

### Scene slots

| n | Route | File | Shape | Source |
| --- | --- | --- | --- | --- |
| 1 | `/` (pure image cell) | `app/page.tsx` | 960 x 640 | SVG fallback `public/illustrations/scene-1.svg` (existing) |
| 2 | `/about` (intro, glow card) | `app/about/page.tsx` | 960 x 600 | SVG fallback `scene-2.svg` (existing) |
| 3 | `/new` (beside the form) | `app/new/page.tsx` | 960 x 720 | SVG fallback `scene-3.svg` (existing) |
| 4 | `/site/[slug]` (under settings) | `components/plan-view.tsx` | 880 x 440, wide | SVG fallback `scene-4.svg` (new) |
| 5 | `/` (beside the "Crew sites" title) | `app/page.tsx` | 640 x 600, near square | SVG fallback `scene-5.svg` (new) |
| 6 | `/about` (closing, beside Sources) | `app/about/page.tsx` | 720 x 720, square | SVG fallback `scene-6.svg` (new) |

`public/brand/` is empty, so all six render their SVG fallback. The new SVGs use only key-block hexes, rounded forms, no comments and no `--`.

## Decisions

- **Signature 2 approach: both (a) and (b).** Matching `layoutId`s sit on the collection row, its in-place "Quick look" panel and the `PlanView` header. The in-place panel (option a) is where the morph reliably runs: pressing "Quick look" morphs the row's name and figure block into the larger panel in the same tree, and the panel holds a real link to `/site/[slug]`. A full route change (option b) crosses the `app/site/[slug]/loading.tsx` boundary, so the old row unmounts before the header mounts; that path falls back to the `calidra-drop` entrance. The row name is a real `Link`, the toggle is a `Button` with `aria-expanded`.
- **Sort values.** All come from `summarizeSite` in `lib/heat.ts` (unchanged): `peakWbgtC`, `crewRestMin` (current shift at the site's settings) and stop-work hours, counted by `stopHours()` from the summary's `strip` inside the site's own shift. The spec named "hours where heavy work must stop"; the count uses each site's own workload, and the label says "Stop-work hours in shift" to stay true. Ties fall back to peak then name.
- **Detail figures.** `PlanView` shows the same `SiteFigures` block computed with `summarizeSite(site, hours)`, plus a line saying these use the site's saved plan while the counter follows the lead's settings.
- **Hover breakdown placement.** The popover is positioned in a `relative` wrapper outside the strip's `overflow-x-auto` box, so it is never clipped; its left edge is clamped inside the strip.
- **Footer hackathon link.** No exact Devpost URL for Code for Change is recorded in the repo, so the footer links to `https://devpost.com/hackathons?search=Code%20for%20Change`. Replace it with the hackathon page address once confirmed.
- **CTA target.** DEMO step 1 continues into the collection, so the one primary CTA scrolls to `#sites`; the Phoenix plan is reached from the claim cell link, the live cell link and the row.
- **No new dependency, route, env variable or schema change.** `SortKey` gained `"stops"` (a type, parsed from the URL; invalid values still fall back to `peak`).

## Failed attempts

None seen; nothing could be run.

## Files changed

New: `components/ui/segmented.tsx`, `components/ui/disclosure.tsx`, `components/site-sort-bar.tsx`, `components/site-figures.tsx`, `public/illustrations/scene-4.svg`, `scene-5.svg`, `scene-6.svg`, `SUBMISSION.md`, `docs/SCREENSHOTS.md`, `.farm-commits.json`.

Edited: `app/page.tsx`, `app/layout.tsx`, `app/about/page.tsx`, `app/new/page.tsx`, `components/site-nav.tsx`, `components/site-collection.tsx`, `components/plan-view.tsx`, `components/live-strip-cell.tsx`, `lib/types.ts`, `lib/data.ts`, `README.md`, `DEMO.md`, `CLAUDE.md`, `IDENTITY.md` (one Amendments line), `HANDOFF.md`.

## Commands run

None. The agent had no shell.

## Open questions

- Motion `^14.14.0` is the range IDENTITY.md fixes; the APIs used (`motion`, `LayoutGroup`, `layoutId`, `layout`, `useReducedMotion`, `animate`) are long-standing. If the build reports a type mismatch on `layout={false}`, switch to `layout={reduce ? undefined : "position"}`.
- `w-68` (popover width) relies on Tailwind 4's open spacing scale. If it does not compile, use `w-[17rem]`.
- AutoAnimate on the `ul` and Motion layout on each row both react when a quick look opens; check that the rows below slide once, not twice.
- `.env.example` keeps `NEXT_PUBLIC_BRAND_FILES` commented out because `next.config.ts` sets it at build time.
- Still open: OSHA reference values in `tests/wbgt-reference.json` (human task, README states it is not filled); the hackathon page URL above.

## Unmet against the spec

- The route-change morph (row to `/site/[slug]`) is not guaranteed; the in-place panel carries the morph (`components/site-collection.tsx`, `SiteRow`, `open` branch). Spec option (a) and (b) both allowed this.
- `npm run build`, `npm test`, `npm run proof`, the 360/768/1280 checks, Lighthouse and the print preview are unverified (no shell).
- No "compare two" toggle (optional, cut first by the spec).
- At 768 px the bento is a single stacked column (only `lg:` spans exist), which avoids horizontal scroll but does not show the unequal grid until 1024 px.

## Next best step

Runner: `npm install`, `npm run build` (one repair round), `npm test`, `npm run proof`, then commit from `.farm-commits.json` and redeploy. Then Phases 6 and 7: judge rounds, freeze and tag.

## QA: live crawl round 1 (2026-11-24)

- The crawl of https://calidra.vercel.app reported no console, pageerror, request, visible, data or asset findings.
- Its only line was from `npm run proof`: `tests: passed=50 failed=0 skipped=1`. That is a pass. The one skip is `tests/heat.test.ts` "OSHA Outdoor WBGT Calculator reference points", which skips on purpose while `tests/wbgt-reference.json` is `[]`. No code change was made: filling it with invented numbers would fake a validation. Human task: enter three real OSHA calculator points (hot dry, hot humid, overcast) and the skip turns into three asserting tests.

## QA: external findings

- None this round.

## Manual submit checklist (human)

- [ ] Every team member is a student and above the age of majority where they live.
- [ ] Every team member's name is added on Devpost.
- [ ] The GitHub repo is public.
- [ ] Record the demo video yourself and paste its link into Devpost; upload it to public YouTube or Vimeo.
- [ ] Gallery thumbnail 3:2, under 5 MB (see `docs/SCREENSHOTS.md`).
- [ ] Paste the fields from `SUBMISSION.md` in order; confirm the live URL and the crew sheet QR host match the deploy.
- [ ] Submit by 29 November (deadline 1 December 2026, 5:00 pm PST).
- [ ] Ask the organizer about the winners date: the rules page says 21 November, the dates page 5 December.
