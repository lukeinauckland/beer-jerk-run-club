# Deployment Troubleshooting

## Vercel Build Fails

Run locally:

```sh
cd production
npm run check
```

If that fails, fix the failing line before touching Vercel.

Common causes:

- Broken JSON in `content/site.json`
- Missing image in `assets/`
- Deleted `dist/` without rebuilding
- Wrong Vercel root directory

Vercel root directory must be:

```text
production
```

## Vercel Deploys But Page Is Blank

Check Vercel project settings:

```text
Build Command: npm run build
Output Directory: dist
Root Directory: production
```

Then redeploy.

## Domain Does Not Work

Check:

1. Domain has been added to Vercel.
2. Hover DNS matches the values Vercel shows.
3. Old conflicting records are removed.
4. You waited long enough for DNS propagation.

Usually:

```text
@       A       76.76.21.21
www     CNAME   cname.vercel-dns.com
```

Use Vercel's exact dashboard values if they differ.

## HTTPS Not Ready

Wait. Vercel issues certificates after DNS is correct. This can take a while.

If it is still broken after a day:

- Re-check DNS records.
- Remove conflicting AAAA records.
- Remove duplicate CNAME records.
- Re-add the domain in Vercel if needed.

## Google Does Not Index Quickly

Check:

- `https://beerjerkrunclub.co.nz/robots.txt`
- `https://beerjerkrunclub.co.nz/sitemap.xml`
- Google Search Console URL Inspection
- Sitemap submitted
- Beer Jerk Shopify page links to the new domain
- Instagram and Strava link to the new domain

Branded searches should appear first. Broad terms like `Auckland run club` will take longer.

## Rich Results Test Warns

Warnings are not always fatal.

Critical issue:

- Invalid JSON-LD

Non-critical:

- Google does not show a special result for every schema type.
- Some structured data can be valid but not eligible for a rich display.

## Wrong Next Run

Edit:

```text
content/site.json
```

Check:

- `schedule.anchorMonday`
- `schedule.publicHolidays`
- active route order in `routes`

Then run:

```sh
npm run check
```
