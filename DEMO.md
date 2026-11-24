# DEMO: Calidra, 90 seconds

**Problem:** Heat index assumes shade; your crew works in the sun.

**Trigger:** open the start route, press the Phoenix row.

**Wow moment:** drag the shift start from 07:00 to 05:00 on the Phoenix site and watch the rest counter roll down while the "Best window" badge updates, beside a line where the heat index reads a lower band than the sun verdict for an hour where WBGT says stop ("Caution" on days where that happens, "Extreme caution" on the Phoenix seed).

**Closing line:** "WBGT for every crew lead without a meter, in a browser tab."

**Demo start route:** `/`

Data: every step renders through `lib/adapter.ts` and the `/api/*` handlers. The default is `ADAPTER_MODE=fake`; with `ADAPTER_MODE=real` the same steps show live Open-Meteo hours and the badge on the site page says so.

## Reset (before every run)

0. Run `npm run demo:reset` (seed check, then it prints the reset URL), then open `/?demo-reset=1` in the demo browser. That clears the sites saved on `/new` in this browser and reloads the collection with the 10 seed sites. There is no server store and no chain state to reset.

## Steps

1. `/` (`app/page.tsx`): read the problem line in the largest bento cell, point at the live strip cell, then the crew site collection below it. Press one workload filter to show the rows reorder, then clear it.
2. `/site/phoenix-desert-ridge-framing` (`app/site/[slug]/page.tsx`): press the Phoenix row. The hour strip fills. Point at the line under the counter: the heat index reads a lower band than the sun verdict for an hour where sun WBGT says stop. On the Phoenix seed that band is "Extreme caution"; on days with a "Caution" hour it reads "Caution".
3. Same route (`app/site/[slug]/page.tsx`): settings are workload heavy, crew 6, 2 new workers on day 2. Show them in the settings panel.
4. Same route (`app/site/[slug]/page.tsx`): drag the shift start from 07:00 to 05:00. The rest counter rolls down and the gold "Best window" badge updates.
5. `/site/cuiaba-soy-field-crew` (`app/site/[slug]/page.tsx`): go back and open the Cuiabá site, tomorrow's forecast site, in the southern hemisphere summer.
6. `/new` (`app/new/page.tsx`): search "Cuiab" or press "Fill with Phoenix, 19 Jul 2023", save. The new site appears at the top of `/` with a "Yours" badge. Saving the same inputs again (or a double click) leaves one row.
7. `/about` (`app/about/page.tsx`): the method, the threshold table computed from the engine, and the limits.

## Real path and fallback

Each step names the file with the real path and the file with its fallback. Every page waits at most 4 s (`HOURS_BUDGET_MS` in `lib/config.ts`) for live hours, so no step should pass 5 s.

1. `/`: real path `lib/adapters/real.ts` (`realAdapter.getHours`, cached per place and date); fallback `lib/adapters/real.ts` to `fakeAdapter.getHours` in `lib/adapters/fake.ts`.
2. Phoenix plan and gap line: real path `lib/adapters/real.ts` then `lib/heat.ts` (`findMismatch`, then `findBandGap`); fallback `lib/adapters/real.ts` to `fakeAdapter.getHours`.
3. Settings: real path `lib/adapters/real.ts` (hours) and `components/plan-view.tsx` (settings); fallback `lib/adapters/real.ts` to `fakeAdapter.getHours`.
4. Slider and best window: real path `lib/adapters/real.ts` then `lib/heat.ts` (`shiftTotals`, `bestStart`); fallback `lib/adapters/real.ts` to `fakeAdapter.getHours`.
5. Cuiabá forecast: real path `lib/adapters/real.ts` (forecast cache, 30 min); fallback `lib/adapters/real.ts` to `fakeAdapter.getHours`.
6. Save on `/new`: real path `app/api/places/route.ts` (geocoding) and `app/api/hours/route.ts` through `lib/adapters/real.ts`, stored by `lib/site-store.ts`. Place search has no server fallback, so the "Fill with Phoenix, 19 Jul 2023" preset in `components/new-site-form.tsx` is the documented fallback; the hours call falls back to `fakeAdapter.getHours` like the steps above.
7. `/about`: static page, no data call; real path `app/about/page.tsx`, fallback not needed (root `app/error.tsx` covers a render error).

Planned, no route yet: a printable EN/ES crew sheet with a QR code back to the live plan (Phase 4).
