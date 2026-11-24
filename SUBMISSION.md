# Devpost submission: Calidra

Fields in the order the Devpost form asks for them. Copy each block as is. Team member names and the eligibility confirmation are filled in on Devpost by the team.

## Project name

Calidra

## Tagline (the one-line pitch field, 200 characters max)

Heat index assumes shade. Calidra gives outdoor crew leads in-sun WBGT for every hour, the work and rest minutes it allows, and the shift start that loses the least time.

(170 characters)

## About the project (Markdown)

### Inspiration

Outdoor workers die from heat every summer, and many of those deaths happen in a worker's first days on the job. The free tool most crew leads reach for is built on the heat index, which assumes shade and a light breeze. OSHA's own guidance says full sun can add up to 15°F and that WBGT is the better measure, but a small roofing, farm or landscaping crew has no WBGT meter. We wanted the crew lead to answer one question at 6 a.m.: how many minutes of break does my crew need each hour today?

### What it does

- The home page lists ten crew sites, each with a 24 hour strip and three figures: peak sun WBGT, stop-work hours in the shift and crew rest owed. A sort control reorders the sites by any of them.
- A site page shows every hour of the day: sun WBGT, heat index, and how many minutes of each hour veterans and new workers can work. Hovering or tabbing across the strip shows the weather behind each hour.
- Dragging the shift start rolls the rest counter and updates the "Best window" badge. On the Phoenix heat day, moving a heavy framing crew of six from 07:00 to 05:00 cuts the rest they owe.
- A line under the counter shows the gap the heat index hides: an hour where the shade number reads "Extreme caution" while the sun verdict says stop.
- "Crew sheet" prints a one-page plan in English or Spanish with a QR code that reopens the same plan.
- "Plan a site" adds any town and date; the site is saved in that browser.

### How we built it

Next.js 15 with the App Router, React 19, TypeScript 5 and Tailwind CSS 4. The engine in `lib/heat.ts` is our own code written from published equations: solar position, the Liljegren (2008) globe and natural wet bulb energy balances solved by iteration, outdoor WBGT, the NWS heat index regression, the ACGIH work/rest curves and the NIOSH ramp for new workers. Hourly weather comes from the keyless Open-Meteo forecast, historical archive and geocoding APIs, called from the server with a timeout, one retry and zod validation, and cached per place and date. If a call fails, the site falls back to a stored day profile and says so in words. AutoAnimate and Motion move the collection rows and morph a row into its larger view. `qrcode` draws the crew sheet QR on the server. Vitest covers the engine, the schemas, the HTTP helper, the browser store, the URL settings and the crew sheet.

### Challenges we ran into

Open-Meteo reports radiation as the mean of the previous hour, so the sun has to be placed half an hour earlier or the globe temperature drifts at dawn and dusk. The heat index "Caution" mismatch we expected on the Phoenix day never happens there (the night stays too hot), so the page shows the real band gap instead of forcing the story.

### What's next

A crew sheet for sites saved in a browser, the OSHA calculator comparison table, a shaded rest area that lowers break minutes, and shared sites across phones.

### Impact

Heat illness is preventable with water, rest and shade, and the rest has to be scheduled before the afternoon. Calidra puts a WBGT based schedule in a browser tab for crews that will never buy a meter, with a stricter plan for workers in their first week and a printed sheet in Spanish for crews where that is the working language.

### Originality

The common tools stop at a shade heat index and a color. Calidra computes WBGT in the sun from ordinary weather data, turns it into minutes of work and rest per hour, and scans every shift start to find the one that loses the least time.

### Technical Execution

The physics runs in our own engine on every hour, server side and in the browser, with live Open-Meteo data behind a timeout, retry, cache and schema check, and a stated fallback. Settings live in the URL, so a shared link or the QR code opens the same plan. Tests cover the engine and every boundary.

### Usability and Presentation

One page per site, one slider for the decision that matters, plain sentences next to every number, 44 px touch targets, keyboard access to every hour, a print sheet laid out for one page, and every animation turned off when the device asks for reduced motion.

## Built with

nextjs, react, typescript, tailwindcss, zod, motion, auto-animate, qrcode, lucide-react, vitest, open-meteo-forecast-api, open-meteo-historical-api, open-meteo-geocoding-api, vercel

## Try it out links

- https://calidra.vercel.app
- https://github.com/mericcintosun/calidra

## Prize track

First Place
