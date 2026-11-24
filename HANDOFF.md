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
