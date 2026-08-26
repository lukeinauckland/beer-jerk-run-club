# Future Edits

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
