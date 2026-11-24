# DEMO: Calidra, 90 seconds

**Problem:** Heat index assumes shade; your crew works in the sun.

**Trigger:** open the start route, press the Phoenix row.

**Wow moment:** drag the shift start from 07:00 to 05:00 on the Phoenix site and watch the rest counter roll down while the "Best window" badge updates beside a heat-index "Caution" hour that WBGT calls "stop".

**Closing line:** "WBGT for every crew lead without a meter, in a browser tab."

**Demo start route:** `/`

Data: every step renders from seed data through `lib/adapter.ts` and the `/api/*` handlers. The default is `ADAPTER_MODE=fake`; with `ADAPTER_MODE=real` the same steps show live Open-Meteo hours and the badge on the site page says so.

## Steps

1. `/` (`app/page.tsx`): read the problem line in the largest bento cell, point at the live strip cell, then the crew site collection below it. Press one workload filter to show the rows reorder, then clear it.
2. `/site/phoenix-desert-ridge-framing` (`app/site/[slug]/page.tsx`): press the Phoenix row. The hour strip fills. Point at the mismatch line under the counter: the heat index reads "Caution" for an hour where sun WBGT says stop.
3. Same route (`app/site/[slug]/page.tsx`): settings are workload heavy, crew 6, 2 new workers on day 2. Show them in the settings panel.
4. Same route (`app/site/[slug]/page.tsx`): drag the shift start from 07:00 to 05:00. The rest counter rolls down and the gold "Best window" badge updates.
5. `/site/cuiaba-soy-field-crew` (`app/site/[slug]/page.tsx`): go back and open the Cuiabá site, tomorrow's forecast site, in the southern hemisphere summer.
6. `/new` (`app/new/page.tsx`): search "Cuiab" or press "Fill with Phoenix, 19 Jul 2023", save. The new site appears at the top of `/` with a "Yours" badge.
7. `/about` (`app/about/page.tsx`): the method, the threshold table computed from the engine, and the limits.

Planned, no route yet: a printable EN/ES crew sheet with a QR code back to the live plan (Phase 3 and later).
