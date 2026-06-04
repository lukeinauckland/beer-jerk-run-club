# Update Templates

Use these when facts change.

## Christmas Break

Edit:

```text
content/site.json
```

Change:

```json
"christmasRule": "Christmas break dates are announced on Instagram each summer."
```

To something like:

```json
"christmasRule": "Christmas break: no runs from 23 December to 2 February."
```

Also update:

```json
"christmasBreak": {
  "startMonth": 12,
  "startDay": 23,
  "endMonth": 2,
  "endDay": 2
}
```

Then run:

```sh
npm run check
```

## Public Holiday

Add to:

```text
schedule.publicHolidays
```

Example:

```json
"2027-10-25": "Labour Day"
```

Then run:

```sh
npm run check
```

## Domain Loop Returns

Edit the Domain route:

```json
"status": "active"
```

If you want the full four-route rotation order, reorder the `routes` array.

Then update:

```text
schedule.winterNote
```

Then run:

```sh
npm run check
```

## Half Marathon Becomes Relevant

Do not add a ticket link until there is a real current ticket page.

When ready, update:

```text
club.halfMarathonMention
```

Then add a proper page or section with:

- date
- price
- distance options
- current ticket link
- after-run details

## Beer Offer Changes

Edit:

```text
club.beerDeal
```

Current:

```text
$10 beers for runners after every run.
```

Then run:

```sh
npm run check
```
