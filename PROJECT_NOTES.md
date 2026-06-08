# Beer Jerk Run Club Website Notes

This repo is the production static site for Beer Jerk Run Club:

`https://beerjerkrunclub.co.nz`

Use this file as the handover context for future Codex chats.

## How To Work

- Main editable content is in `content/site.json`.
- Site generation is in `scripts/build.mjs`.
- Built output goes to `dist/`.
- Run `npm run check` before calling work done. It rebuilds `dist/`, validates SEO/content rules, and updates `BUILD_REPORT.md`.
- Commit changes in small, readable commits.
- Do not invent club facts, stats, lore, testimonials, route details, cancellation history, or organiser names.
- Do not use em dashes in public HTML.

## Voice

Luke wants direct, British-English copy. No fluff, no self-congratulation, no “community” waffle, no fake lore.

Good tone: warm, practical, confident, social.

Bad tone: tryhard, overly cool, corporate, sentimental, or fabricated.

Locked phrases:

- `People. Over. Pace.`
- `$10 beers for runners after every run.`
- `Free. Just turn up.`

## Purpose

The site exists so people can discover the club and quickly understand:

- what Beer Jerk Run Club is
- when and where to go
- whether it is free
- whether beginners are welcome
- what pace pressure to expect
- how far the runs are
- what happens after
- where to follow or join

Primary search intent:

- Auckland run club
- Auckland running club
- social run club Auckland
- beginner friendly run club Auckland
- Monday run club Auckland
- 5km run club Auckland

## Locked Facts

- Club: Beer Jerk Run Club.
- Location: Small Gods Taproom, 2 Shaddock Street, Eden Terrace / Uptown, Auckland.
- Monday run: bag drop from 5pm, run starts 5:40pm sharp.
- Usual Monday route distance: 5km.
- Winter Monday route rotation: Beer Mile, Grange Hill, Maungawhau, then repeat.
- Domain Loop returns when daylight saving returns.
- Public holiday Mondays shift to Tuesday.
- Free. No signup. Just turn up.
- Runners buy their own drinks.
- `$10 beers for runners after every run.`
- Gear can be left safely at the Taproom while running.
- There is bike parking. No dedicated carpark, but nearby street parking exists.
- Beginners can ask organisers for a shorter route and help building up to 5km.
- AFTERS: monthly long run on the first Saturday of the month, 8km or 13km, meet 11:00am, run 11:15am.
- Strava: `https://www.strava.com/clubs/beerjerk`
- Instagram: `https://www.instagram.com/beerjerkrunclub/`

## Launch Scope

Launch includes:

- static HTML pages
- homepage
- focused SEO pages: `/new-runners`, `/schedule`, `/routes`, `/afters`
- `robots.txt`
- `sitemap.xml`
- `llms.txt`
- `facts.json`
- JSON-LD structured data
- responsive images

Launch excludes:

- full public Streak Board module
- Half Marathon feature/ticket link
- newsletter signup
- CMS
- live Instagram feed
- GPX route map replacement
- GitHub scheduled workflow

The Streak Board can be mentioned in FAQ only:

`Check in for 8 runs in a row and you will get a delicious prize.`

## Design Notes

- Mobile-first. Most users will view on phones.
- Keep first-timer confidence high.
- Prefer useful hierarchy over decorative cleverness.
- The site should feel like BJRC: bold, warm, social, practical.
- Avoid stacking too many giant poster sections in a row.
- Use red for priority, not everywhere.
- Do not add photo captions unless Luke asks.
- Avoid fake Instagram UI. If using Instagram-like photos, preserve square crops.
- Visual QA is mandatory after layout changes.

## Deployment

- GitHub repo: `lukeinauckland/beer-jerk-run-club`
- Hosting: Vercel
- Live domain: `beerjerkrunclub.co.nz`
- DNS lives at Hover.
- Main domain should be non-www:
  - `https://beerjerkrunclub.co.nz`
  - `www` should redirect to non-www.

## Common Pitfalls

- Do not duplicate the same three social/location links in multiple consecutive sections.
- Do not crop square Instagram images into tall cards.
- Do not make the Domain route look like the main winter route.
- Do not over-explain the winter Domain skip.
- Do not feature the Half Marathon while it is far away.
- Do not add Meetup back.
- Do not write “no drop”.
- Do not add “shot on Ricoh”.
- Do not fabricate names, stats, history, or club mythology.
