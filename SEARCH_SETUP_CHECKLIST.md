# Search Setup Checklist

## Schedule Freshness

- Create a Vercel deploy hook for the production branch.
- Add it to GitHub repository secrets as `VERCEL_DEPLOY_HOOK_URL`.
- Keep `.github/workflows/refresh-schedule.yml` enabled. It triggers a fresh Vercel build daily, which keeps the homepage schedule, structured data, sitemap dates and `facts.json` fresh.

Do this after the live site is deployed and DNS is working.

## Google Search Console

1. Go to Google Search Console.
2. Add a new property.
3. Prefer `Domain` property if you are comfortable adding a DNS TXT record in Hover.
4. If you want the simpler route, add a `URL prefix` property:

```text
https://beerjerkrunclub.co.nz/
```

5. Verify ownership.
6. Submit sitemap:

```text
https://beerjerkrunclub.co.nz/sitemap.xml
```

7. Use URL Inspection for:

```text
https://beerjerkrunclub.co.nz/
```

8. Click `Request indexing`.
9. Repeat URL Inspection and request indexing for:

```text
https://beerjerkrunclub.co.nz/new-runners
https://beerjerkrunclub.co.nz/schedule
https://beerjerkrunclub.co.nz/routes
https://beerjerkrunclub.co.nz/afters
```

## Bing Webmaster Tools

1. Go to Bing Webmaster Tools.
2. Sign in.
3. Import from Google Search Console if offered, or add the site manually.
4. Submit sitemap:

```text
https://beerjerkrunclub.co.nz/sitemap.xml
```

5. Inspect the homepage URL.
6. Inspect the focused pages:

```text
https://beerjerkrunclub.co.nz/new-runners
https://beerjerkrunclub.co.nz/schedule
https://beerjerkrunclub.co.nz/routes
https://beerjerkrunclub.co.nz/afters
```

## Rich Results / Structured Data

Run Google's Rich Results Test on:

```text
https://beerjerkrunclub.co.nz/
```

Expected structured data:

- Website
- Organization / SportsOrganization
- SportsActivityLocation
- SportsEvent
- FAQPage

Not every type will necessarily produce a visible rich result. The goal is clarity and eligibility, not a guaranteed special Google display.

## AI Findability

Confirm these load:

```text
https://beerjerkrunclub.co.nz/robots.txt
https://beerjerkrunclub.co.nz/llms.txt
https://beerjerkrunclub.co.nz/facts.json
```

Robots should allow:

- GPTBot
- OAI-SearchBot
- ChatGPT-User
- ClaudeBot
- Claude-User
- PerplexityBot
- Perplexity-User

## External Links To Add

Add `https://beerjerkrunclub.co.nz` to:

- Instagram bio
- Strava club description
- Beer Jerk Shopify `/run-club` page
- Small Gods site if possible
- Meetup page while you still keep it alive

## Search Terms To Monitor

First week:

- `Beer Jerk Run Club`
- `Beer Jerk Run Club Auckland`
- `BJRC Auckland`

Next few weeks:

- `Auckland run club`
- `run club Auckland`
- `social run club Auckland`
- `Monday run club Auckland`
- `Eden Terrace run club`
- `free run club Auckland`

Broad search terms will take longer and need backlinks.
