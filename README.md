# Beer Jerk Run Club site

Production static site for `beerjerkrunclub.co.nz`.

The live files are generated into `dist/`. The important content is plain HTML at build time, so search engines and AI crawlers can read it without waiting for JavaScript.

## Edit Content

Most normal updates are in:

```text
content/site.json
```

Useful fields:

- `club.beerDeal`
- `schedule.publicHolidayRule`
- `schedule.christmasRule`
- `schedule.publicHolidays`
- `routes`
- `links`
- `faq`
- `futureModules.streakBoard`

## Build

```sh
npm run build
```

Output:

```text
dist/
```

Generated public pages:

- `/`
- `/new-runners`
- `/schedule`
- `/routes`
- `/afters`
- `/404`

## Validate

Run this before committing or deploying:

```sh
npm run check
```

This rebuilds the site and checks the generated HTML, JSON-LD, assets, `robots.txt`, `sitemap.xml`, `llms.txt`, `facts.json`, manifest, favicon, OG image, responsive images, 404 page and the launch-scope exclusions.

It also writes:

```text
BUILD_REPORT.md
```

Use that as the quick pre-deploy summary.

## Preview Locally

```sh
npm run preview
```

Then open:

```text
http://localhost:4173
```

This preview server supports clean local links such as `/schedule` and `/routes`, matching the live Vercel behaviour.

If your machine blocks the local preview server, make a direct-open preview:

```sh
npm run build:file-preview
```

Then open:

```text
local-preview/index.html
```

Use `dist/` for deployment. `local-preview/` is only for checking the site without a server.

## Deploy On Vercel

Recommended path:

1. Put this `production/` folder in a GitHub repo, or set Vercel's root directory to `production` if the repo contains older mockup files too.
2. In Vercel, import the GitHub repo.
3. Set root directory to `production`.
4. Vercel should read `vercel.json`:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Add `beerjerkrunclub.co.nz` as the production domain in Vercel.

If using Hover for DNS, keep DNS at Hover and add the records Vercel asks for. Normally:

```text
@     A       76.76.21.21
www   CNAME   cname.vercel-dns.com
```

Vercel may show a slightly different CNAME, so copy the exact value from the Vercel dashboard if it differs.

## Launch Scope

Included:

- Homepage with all key run club facts in static HTML
- Focused static pages for new runners, schedule, routes and Afters
- Upcoming schedule generated at build time
- Monday route rotation
- Afters
- `$10 beers for runners after every run.`
- FAQ
- Instagram, Strava, Beer Jerk and Small Gods links
- JSON-LD structured data
- `robots.txt`
- `sitemap.xml`
- `llms.txt`
- `facts.json`
- favicon and app icons
- generated social share image
- responsive image variants
- shared `styles.css`
- branded 404 page

Current generated `dist/` size is roughly 5.5MB, with responsive image variants and focused static pages included.

Not included for launch:

- Streak Board
- Half Marathon feature or ticket link
- Newsletter form

Half Marathon is mentioned once in the footer only.
