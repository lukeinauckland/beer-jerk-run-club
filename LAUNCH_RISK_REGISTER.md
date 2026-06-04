# Launch Risk Register

These are the things most likely to waste time or hurt launch quality.

## Must Check In Preview

- Mobile layout at real phone width.
- No black empty gaps in the photo wall.
- Hero crop does not hide the useful part of the photo.
- Next run date, route and time are correct.
- Routes are readable on mobile.
- Domain Loop appears after active routes while winter skip is active.
- Afters says `8km or 13km`.
- Strava link goes to `https://www.strava.com/clubs/beerjerk`.
- No public Meetup link.
- No Half Marathon ticket link.

## SEO Risks

- Google may take days or weeks to rank broad terms like `Auckland run club`.
- Meetup may outrank the new site for a while.
- Backlinks matter, so update Instagram, Strava, Beer Jerk Shopify and Small Gods as soon as possible.
- If `beerjerk.co.nz/run-club` exists, it should link clearly to `beerjerkrunclub.co.nz`.

## Content Risks

- Christmas break dates are still generic and should be updated when the real dates are known.
- Public holiday shifts are generated from the current list in `content/site.json`.
- Route maps are good enough for v1, but GPX-derived maps would be better later.
- Streak Board is intentionally excluded until real names and update process are ready.

## Technical Risks

- Vercel project root must be `production`, otherwise Vercel may deploy the wrong thing.
- DNS records must match the values Vercel shows after the domain is added.
- The launch domain should be the canonical non-www domain: `beerjerkrunclub.co.nz`.
- Do not deploy only `dist/` unless you want future updates to become more annoying.

## Decision

Launch once preview QA passes. Do not hold launch for Streak Board, GPX maps, exact Christmas dates, or Half Marathon content.

