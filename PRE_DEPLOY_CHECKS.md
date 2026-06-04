# Pre-Deploy Checks

Run this before every deploy:

```sh
npm run check
```

That command:

1. Rebuilds `dist/`.
2. Parses content JSON.
3. Parses JSON-LD.
4. Checks static H1, opening paragraph, schedule and FAQ.
5. Checks `$10 beers for runners after every run.`
6. Checks Strava and Small Gods map links.
7. Checks canonical URL.
8. Checks `robots.txt`, `sitemap.xml`, `llms.txt`, `facts.json` and `site.webmanifest`.
9. Checks image references.
10. Confirms the launch page does not include Meetup, Half Marathon ticket link, newsletter form, Streak Board copy or old `16km` copy.

If it fails, do not deploy until the failing line is fixed.

## Required Preview Gate

Do not connect the live domain until a Vercel preview has been visually checked.

Required pages:

- `/`
- `/new-runners`
- `/schedule`
- `/routes`
- `/afters`
- `/404`

Required viewport checks:

- mobile around 390px wide
- tablet around 768px wide
- desktop around 1440px wide

The production files can validate perfectly and still have a bad crop, cramped title, awkward route card or mobile spacing issue. Visual QA is mandatory.
