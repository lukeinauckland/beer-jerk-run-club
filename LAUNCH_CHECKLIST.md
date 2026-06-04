# Launch Checklist

## Luke

1. Register `beerjerkrunclub.co.nz`.
2. Use Hover if that is easiest. Hover is fine.
3. Add a Shopify page at `beerjerk.co.nz/run-club` that links to `https://beerjerkrunclub.co.nz`.
4. Update Instagram bio to `https://beerjerkrunclub.co.nz`.
5. Update Strava club description to `https://beerjerkrunclub.co.nz`.
6. Ask Small Gods to link to the site if they are happy to.
7. Keep Meetup alive for 1 to 3 months after launch if it is still bringing search traffic.

## Vercel Deployment

1. Put the `production/` folder into a GitHub repo.
2. In Vercel, import that repo.
3. Set the Vercel project root directory to `production`.
4. Confirm build command is `npm run build`.
5. Confirm output directory is `dist`.
6. Add `beerjerkrunclub.co.nz` to the Vercel project domains.
7. Add `www.beerjerkrunclub.co.nz` too, then set one domain as the redirect target. Prefer the non-www domain:
   - Primary: `beerjerkrunclub.co.nz`
   - Redirect: `www.beerjerkrunclub.co.nz` → `beerjerkrunclub.co.nz`
8. Vercel will issue HTTPS automatically once DNS is correct.

## Hover DNS

After the Vercel project exists and the domain is added, go to Hover DNS and add the records Vercel asks for.

Usually these are:

```text
Host    Type    Value
@       A       76.76.21.21
www     CNAME   cname.vercel-dns.com
```

Vercel's current docs say the apex domain points to `76.76.21.21`; subdomains use a CNAME such as `cname.vercel-dns.com`. If the Vercel dashboard gives a different CNAME, use Vercel's dashboard value.

Remove conflicting old A, AAAA or CNAME records for the same host before saving.

## Confirm Live URLs

Once DNS has propagated, confirm these load:

   - `https://beerjerkrunclub.co.nz/`
   - `https://beerjerkrunclub.co.nz/new-runners`
   - `https://beerjerkrunclub.co.nz/schedule`
   - `https://beerjerkrunclub.co.nz/routes`
   - `https://beerjerkrunclub.co.nz/afters`
   - `https://beerjerkrunclub.co.nz/robots.txt`
   - `https://beerjerkrunclub.co.nz/sitemap.xml`
   - `https://beerjerkrunclub.co.nz/llms.txt`

## Search Setup

1. Add `beerjerkrunclub.co.nz` to Google Search Console.
2. Submit `https://beerjerkrunclub.co.nz/sitemap.xml`.
3. Inspect the homepage URL and request indexing.
4. Inspect and request indexing for `/new-runners`, `/schedule`, `/routes` and `/afters`.
5. Add the site to Bing Webmaster Tools.
6. Submit the same sitemap in Bing.
7. Run Google's Rich Results Test on the homepage.
8. Run a mobile Lighthouse check.

## Post-Launch Checks

Search these after indexing starts:

- `Beer Jerk Run Club`
- `Beer Jerk Run Club Auckland`
- `Auckland run club`
- `Monday run club Auckland`
- `social run club Auckland`
- `Eden Terrace run club`

The broad terms will take longer. Branded terms should appear first.
