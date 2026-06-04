# Vercel Preview QA

Do this before connecting the real domain. This is required, not optional.

## Create Preview

1. Push the repo to GitHub.
2. Import it into Vercel.
3. Let Vercel create a preview deployment.
4. Open the preview URL.

## Check These URLs On The Preview

Replace `PREVIEW_URL` with the Vercel preview URL.

```text
PREVIEW_URL/
PREVIEW_URL/robots.txt
PREVIEW_URL/sitemap.xml
PREVIEW_URL/llms.txt
PREVIEW_URL/facts.json
PREVIEW_URL/site.webmanifest
PREVIEW_URL/404
```

The canonical URL and sitemap will still point to:

```text
https://beerjerkrunclub.co.nz/
```

That is intentional for production. Do not change it just for preview.

## Mobile QA

Open the preview on a phone if possible.

Check:

- Hero text fits.
- Next Run is immediately understandable.
- `$10 beers for runners after every run.` is visible.
- Schedule is readable.
- Routes stack cleanly.
- The Wall has no black empty squares.
- Footer links are usable.
- No horizontal scrolling.
- Tap targets feel usable.
- The quick-action strip is obvious and not cramped.

## Desktop QA

Check:

- Hero crop.
- Wall rhythm.
- Route maps.
- FAQ layout.
- 404 page.
- Focused pages: `/new-runners`, `/schedule`, `/routes`, `/afters`.

## Link QA

Click:

- Instagram
- Strava
- Small Gods map
- Beer Jerk
- Small Gods website

Do not launch if any visible link is broken.
