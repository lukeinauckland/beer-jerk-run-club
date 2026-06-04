# Vercel + Hover Handoff

Use this when you have bought `beerjerkrunclub.co.nz` through Hover and are ready to put the site online through Vercel.

## What You Are Connecting

- Domain registrar: Hover
- Hosting: Vercel
- Main domain: `beerjerkrunclub.co.nz`
- Redirect domain: `www.beerjerkrunclub.co.nz`
- Site folder: `production/`

## GitHub

1. Create a GitHub repo.
2. Add this workspace to the repo.
3. Commit everything.
4. Push to GitHub.

If the repo includes the older mockup files, that is fine. In Vercel, set the root directory to `production`.

## Vercel Project

1. Go to Vercel.
2. Click `Add New` → `Project`.
3. Import the GitHub repo.
4. Set `Root Directory` to:

```text
production
```

5. Confirm:

```text
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

6. Deploy.

Vercel should read `vercel.json`, build the static files, and serve the generated `dist/` folder.

## Add Domain In Vercel

1. Open the Vercel project.
2. Go to `Settings` → `Domains`.
3. Add:

```text
beerjerkrunclub.co.nz
```

4. Add:

```text
www.beerjerkrunclub.co.nz
```

5. Set the non-www domain as primary:

```text
beerjerkrunclub.co.nz
```

Vercel will show the DNS records it wants. Copy those values exactly.

## Hover DNS

In Hover, open the DNS settings for `beerjerkrunclub.co.nz`.

Add the records Vercel asks for. They will usually be:

```text
Host    Type    Value
@       A       76.76.21.21
www     CNAME   cname.vercel-dns.com
```

If Vercel shows a different CNAME, use the Vercel dashboard value.

Delete conflicting records for the same host:

- old `@` A records
- old `@` AAAA records
- old `www` CNAME records
- old `www` A records

Do not delete email records such as MX, SPF, DKIM or DMARC if Hover has them.

## Wait

DNS can update quickly, but allow up to 24 hours. Vercel will show when the domain is valid and HTTPS is ready.

## Final URL Checks

Open these:

```text
https://beerjerkrunclub.co.nz/
https://beerjerkrunclub.co.nz/robots.txt
https://beerjerkrunclub.co.nz/sitemap.xml
https://beerjerkrunclub.co.nz/llms.txt
```

Also check:

```text
https://www.beerjerkrunclub.co.nz/
```

It should redirect to:

```text
https://beerjerkrunclub.co.nz/
```
