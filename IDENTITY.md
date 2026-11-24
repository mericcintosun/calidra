# IDENTITY (contract; every later phase obeys this file)

DIRECTION: D4 velvet
GROUND: #171020 aubergine
SURFACE: #1f1629
DEEP: #291d35
LINE: #3a2a4b
INK: #f0eaf6
ACCENT: #b78df2 lavender
ON_ACCENT: #171020
SECOND: #e0b84e gold
OK: #69a56f
WARN: #e0b84e
BAD: #ef6a5a
FONT_DISPLAY: F4 Bricolage Grotesque (next/font/google: Bricolage_Grotesque)
FONT_BODY: Public Sans (next/font/google: Public_Sans)
FONT_MONO: none
STRUCTURE: S5 explorer-detail
ARCHETYPE: L4 bento
MOTION: M6 drop, prefix calidra-
KIT: K7 flip
RADIUS: round
HEADER: solid ground, border-b in LINE, sticky
LOGO_POLICY: brand-mark

## Why

The farm assigned this identity so that no two projects share a look, a route map or an interaction style. The most recent projects it differs from: AI for Medicine: A Global Student Hackathon on the Future of Care (D9, S2, L1, K2); Global AI Builder’s Challenge (D17, S3, L5, K5); InnovateHER Hackathon: Girls Who Code (D14, S4, L6, K6). It is not a suggestion. Tie the product's own nouns to it; do not swap any row for a familiar one.

## Direction: D4 velvet

Aubergine dark, plush and saturated, a soft glow allowed.

Surface treatment: Saturated purple panels stacked by elevation, one soft accent glow per screen, generous round corners, gold used only for tiny details.

Every hex in app/globals.css comes from the key block above. RADIUS round means 0.75rem and above on every card, panel and control. ON_ACCENT is the text color on an ACCENT fill. The semantic colors (OK, WARN, BAD) mark state only, never brand.

## Structure: S5 explorer-detail

Home is a browsable collection of the product's records; each record opens a rich detail page.

Route map (name the bracketed parts with the product's own words):
- `/` : the collection (gallery, list, map or table as the domain suggests) with filter and search
- `/<entity>/[slug]` : the detail page, where the core action and the wow moment live
- `/new` : the create or submit flow that adds a record
- `/about` : method and sponsor tech

Rules:
- the collection shows at least 8 seeded records, each with one real figure on its card or row
- filter and search state lives in the URL
- a newly created record appears in the collection immediately

## Archetype: L4 bento (the composition of the home route)

The hero is a 12-column grid of 5 to 7 unequal cells: one cell is the CTA, one is the live product, one is pure image; no traditional hero copy block exists.

MUSTs: no two cells share dimensions; the claim lives inside the largest cell; every cell has content, none is filler.
Bans: a lead paragraph above the grid; equal-width card rows.

## Motion: M6 drop (the entrance signature)

translateY(-14px) rotate(-1.5deg) to rest plus fade, cubic-bezier(0.34, 1.56, 0.64, 1), 520ms. One keyframe block implements it; every keyframe name starts with `calidra-`. A `prefers-reduced-motion: reduce` block disables it.

## Interaction kit: K7 flip

AutoAnimate with Motion layout: lists that reorder and views that morph.

Packages for package.json dependencies: "@formkit/auto-animate": "^0.11.0", "motion": "^14.14.0".

Typical import: `import { useAutoAnimate } from "@formkit/auto-animate/react"; import { motion, LayoutGroup } from "motion/react";`

Signature interactions (the scaffold ships the first; all three exist by the end of the frontend phase):
1. auto-animated collections: adding, removing, filtering and reordering the seed records animates their positions (`useAutoAnimate`)
2. a view morph: clicking a record morphs it into its detail through `layoutId`
3. an inline sort or compare control that visibly reorders rows

Rules:
- the reorder is driven by real seed values, never a decorative shuffle
- add the packages above to package.json `dependencies` (and `devDependencies` where listed) with exactly these ranges; the runner installs them
- every import of a kit package lives in a component that starts with `"use client"`
- server HTML must be readable with JavaScript off: never server-render content at opacity 0 or off screen; animate from the visible state or on interaction
- honor `prefers-reduced-motion: reduce`: the content and every control stay usable with motion off
- every interaction is driven by the real seed data; a decorative animation with no product meaning does not count as a signature

## Amendments (append-only; later phases add dated lines here, never edit anything above)

- 2026-11-24 (phase 5): K7 signature 2 uses matching `layoutId`s (`site-${slug}-name`, `site-${slug}-figure`) on the collection row, its in-place "Quick look" panel and the `PlanView` header. The in-place panel is where the morph reliably runs; a full route change to `/site/[slug]` falls back to the `calidra-drop` entrance. Signature 3 is the segmented sort control in `components/site-sort-bar.tsx`.
