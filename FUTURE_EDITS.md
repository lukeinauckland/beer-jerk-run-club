# Future Edits

## Remaining Improvements

These are useful improvements, not launch blockers. Tackle them in this order.

### 1. Add Mobile Navigation

**Priority:** Medium

The desktop navigation is hidden below 720px, leaving mobile visitors without a
quick route to the schedule, routes, new-runner guide or AFTERS page.

**Done when:** Mobile has a compact, accessible menu that works with touch and
keyboard controls, does not cover page content and has been checked at common
phone widths.

### 2. Make Schedule Refreshing More Resilient

**Priority:** Medium

The daily GitHub Action currently keeps the static schedule and search metadata
fresh. Scheduled workflows in an inactive public repository can eventually be
disabled, so the deployment needs a backup or a move to a durable scheduler.

**Done when:** A missed GitHub schedule cannot leave the public schedule stale,
and a failed refresh produces a visible alert.

### 3. Make Sitemap Dates Accurate

**Priority:** Low

The daily build currently gives every sitemap entry the build date even when the
page content has not meaningfully changed. Remove those dates or derive them from
real content changes.

**Done when:** `<lastmod>` only changes after a meaningful page update, or is
omitted where no trustworthy modification date exists.

### 4. Review Search Performance After Enough Data Accumulates

**Priority:** Low, but useful for marketing decisions

Use Google Search Console, Bing Webmaster Tools and Vercel Analytics to review
queries, landing pages, click-through rate and mobile traffic after four to six
weeks. Prioritise improvements supported by real search behaviour.

**Done when:** The review records the strongest queries, pages gaining traction
and the next one or two content or backlink actions.

### External Listing Cleanup

Luke is updating the Beer Jerk and Small Gods pages separately. Keep the public
details aligned with `PROJECT_NOTES.md`: bag drop from 5pm, run starts 5:40pm
sharp, and link back to `https://beerjerkrunclub.co.nz`.

Most regular changes happen in:

```text
content/site.json
```

After editing, run:

```sh
npm run build
```

Then commit and push. Vercel will rebuild from GitHub.

## Change The Beer Offer

Edit:

```text
club.beerDeal
```

Current:

```text
$10 beers for runners after every run.
```

## Change Christmas Break Wording

Edit:

```text
schedule.christmasRule
schedule.christmasBreak
```

The visible wording comes from `schedule.christmasRule`.

The generated schedule skips dates using:

```text
schedule.christmasBreak
```

## Add Public Holidays

Edit:

```text
schedule.publicHolidays
```

Format:

```json
"2027-10-25": "Labour Day"
```

When a Monday matches this list, the generated schedule shifts that run to Tuesday.

## Change Route Rotation

Edit:

```text
schedule.rotation
schedule.summerRotation
```

The winter rotation is Beer Mile, Grange Hill, then Maungawhau. Domain starts
the summer rotation on the first Monday after daylight saving begins, followed
by Beer Mile, Grange Hill and Maungawhau. The site removes Domain's winter-skip
treatment automatically during summer.

## Change Images

Images live in the root workspace:

```text
assets/
```

References live in:

```text
content/site.json
```

Useful fields:

- `images.hero`
- `images.crowd`
- `images.wall`
- `images.og`
- route `map`

Keep image filenames simple. Avoid spaces.

## Add The Streak Board Later

There is a dormant example:

```text
content/streak-board.example.json
```

Important rules:

- Do not publish dummy names.
- Use real runner data only.
- Keep `enabled` false until the module is actually built and checked.

The launch site intentionally excludes the Streak Board. This avoids fake names, update burden and extra visual bulk.

## Half Marathon

Launch site only mentions the Half Marathon in the footer.

When the next race is close enough, add a proper section back and include:

- date
- distance options
- ticket link
- route
- after-run details

Do not leave stale ticket links up between events.
