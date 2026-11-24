# CLAUDE.md: Calidra

Read `IDENTITY.md` (binding for colors, fonts, routes, motion), then `HANDOFF.md`, then `DEMO.md`.

## Commands

- `npm install`
- `npm run build` (must stay green after every change)
- `npm run dev` (http://localhost:3000)
- `npm run seed` (checks that seed slugs in `lib/data/seed.ts` are unique and that 8 or more sites exist; writes nothing)

## Data seam

- `lib/types.ts` holds every shared type, including `ApiResponse<T>`.
- `lib/data/seed.ts` holds the 10 seed sites. `lib/data.ts` re-exports types and seed and keeps `parseFilters`. The directory `lib/data/` and the file `lib/data.ts` coexist on purpose; `@/lib/data` resolves to the file.
- `lib/adapter.ts` exports `getAdapter()`. `ADAPTER_MODE=real` picks `lib/adapters/real.ts` (Open-Meteo); anything else picks `lib/adapters/fake.ts` (seed).
- Server pages call `getAdapter()`. Client components call `/api/sites`, `/api/sites/[slug]`, `/api/hours`, `/api/places`. No file under `app/` or `components/` imports `fetchHourly`, `searchPlaces` or `seedHours`.

## Stack pitfalls

- Tailwind CSS v4 with no config file. Tokens live only in `app/globals.css`; no raw hex in components (the OG image is the one exception).
- Kit imports (`@formkit/auto-animate`, `motion`) only in files that start with `"use client"`.
- Next.js 15: `params` and `searchParams` are Promises; await them.

## Never touch

- `public/illustrations/`, `public/logo.svg`, `app/icon.svg`
- `lib/brand-files.ts`
- `app/opengraph-image.tsx`

## Vercel guardrails

- No runtime filesystem writes in app code. Build-time code and seed scripts may read or write; `lib/brand-files.ts` and `next.config.ts` run at build time only.
- `useSearchParams` only under a `Suspense` boundary.
- No Node-only APIs on edge paths; no custom server, no `output: "export"`, standard Next build.
- Every `process.env` key read in the repo has a line in `.env.example` (`ADAPTER_MODE`, `NEXT_PUBLIC_BRAND_FILES`).

## Writing rules

No em dash, en dash or double hyphen as a dash. Plain English, numbers over adjectives. Keep the safety disclaimer in the footer.

When compacting preserve the list of modified files and test commands.
