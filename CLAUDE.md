# CLAUDE.md: Calidra

Read `IDENTITY.md` (binding for colors, fonts, routes, motion), then `HANDOFF.md`, then `DEMO.md`.

## Commands

- `npm install`
- `npm run build` (must stay green after every change)
- `npm run dev` (http://localhost:3000)
- `npm run seed` (checks that seed slugs in `lib/data/seed.ts` are unique and that 8 or more sites exist; writes nothing)
- `npm test` (Vitest, offline: `tests/heat.test.ts`, `tests/schemas.test.ts`, `tests/http.test.ts`, `tests/site-store.test.ts`, `tests/plan-params.test.ts`, `tests/print-sheet.test.ts`)
- `npm run demo:reset` (seed check, then prints the reset URL `/?demo-reset=1` that clears browser-saved sites)
- `npm run proof` (one live Open-Meteo call plus the test run; rewrites the PROOF blocks in README.md, exits 0 even offline)

## Data seam

- `lib/types.ts` holds every shared type, including `ApiResponse<T>`.
- `lib/data/seed.ts` holds the 10 seed sites. `lib/data.ts` re-exports types and seed and keeps `parseFilters`. The directory `lib/data/` and the file `lib/data.ts` coexist on purpose; `@/lib/data` resolves to the file.
- `lib/adapter.ts` exports `getAdapter()`. `adapterMode()` in `lib/config.ts` (the only reader of `ADAPTER_MODE`) returns `"real"` for `ADAPTER_MODE=real`, which picks `lib/adapters/real.ts` (Open-Meteo); anything else picks `lib/adapters/fake.ts` (seed).
- `lib/config.ts` holds every endpoint, timeout, retry, revalidate and query limit constant. Every outbound fetch goes through `fetchJson()` in `lib/http.ts`. Query and upstream schemas live in `lib/schemas.ts`; error codes and hints in `lib/errors.ts`.
- Server pages call `getAdapter()`. Client components call `/api/sites`, `/api/sites/[slug]`, `/api/hours`, `/api/places`. No file under `app/` or `components/` imports `fetchHourly`, `searchPlaces` or `seedHours`, and no `"use client"` file imports `lib/config.ts`, `lib/http.ts` or `lib/open-meteo.ts` (date helpers `isoDate` and `resolveDate` live in `lib/heat.ts`).
- `ApiResponse.error` is `{ error: ErrorCode, hint }` or null. Switch on the code, never on text.

## Stack pitfalls

- Tailwind CSS v4 with no config file. Tokens live only in `app/globals.css`; no raw hex in components (the OG image is the one exception).
- Kit imports (`@formkit/auto-animate`, `motion`) only in files that start with `"use client"`.
- Next.js 15: `params` and `searchParams` are Promises; await them.

## Never touch

- `public/illustrations/` (scene-1 to scene-6 exist; replace a scene only on purpose), `public/logo.svg`, `app/icon.svg`
- `lib/brand-files.ts`
- `app/opengraph-image.tsx`

## Vercel guardrails

- No runtime filesystem writes in app code. Build-time code and seed scripts may read or write; `lib/brand-files.ts` and `next.config.ts` run at build time only.
- `useSearchParams` only under a `Suspense` boundary.
- No Node-only APIs on edge paths; no custom server, no `output: "export"`, standard Next build.
- Every `process.env` key read in the repo has a line in `.env.example` (`ADAPTER_MODE`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BRAND_FILES`).

## Interaction kit (K7)

- Signature 1: `useAutoAnimate` on the collection list in `components/site-collection.tsx`.
- Signature 2: `layoutId` `site-${slug}-name` and `site-${slug}-figure` inside `LayoutGroup` id `SITES_LAYOUT_GROUP` (`components/site-figures.tsx`), on the collection row, its "Quick look" panel and the `PlanView` header.
- Signature 3: `components/site-sort-bar.tsx` (sort by peak WBGT, stop-work hours, rest owed, name) on the `components/ui/segmented.tsx` primitive; sort lives in the URL through `parseFilters`.
- Every kit use passes `undefined` or `false` for layout props when `useReducedMotion()` is true.

## Writing rules

No em dash, en dash or double hyphen as a dash. Plain English, numbers over adjectives. Keep the safety disclaimer in the footer.

When compacting preserve the list of modified files and test commands.
