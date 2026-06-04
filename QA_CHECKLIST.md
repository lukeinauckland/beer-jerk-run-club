# QA Checklist

Run this before launch and again after the live domain is connected.

## Mobile First

Use a phone or browser device preview around 390px wide.

- Hero loads and text is readable.
- Header does not take over the screen.
- Next Run block is clear.
- `$10 beers for runners after every run.` is visible.
- Photo wall has no black empty squares.
- Schedule rows do not overflow.
- Route cards stack cleanly.
- Domain route is clearly marked skipped in winter.
- Afters says `8km or 13km`, not `16km`.
- FAQ is readable.
- Footer links are tappable.

## Desktop

- Hero image is not awkwardly cropped.
- Hero headline and opening paragraph are readable.
- The Wall feels intentional, not patchy.
- Route maps display.
- Footer Tinny does not cover important text.
- No section feels like an old mockup leftover.

## Links

Check every external link:

- Instagram
- Strava Club
- Small Gods map link
- Beer Jerk
- Small Gods website

Confirm absent:

- Meetup link
- Half Marathon ticket link

## SEO Basics

View page source, not devtools-rendered DOM.

- H1 is visible in HTML.
- Opening paragraph is visible in HTML.
- FAQ text is visible in HTML.
- Schedule text is visible in HTML.
- JSON-LD is present.
- Canonical URL is `https://beerjerkrunclub.co.nz/`.

## Root Files

These must load:

- `/robots.txt`
- `/sitemap.xml`
- `/llms.txt`

## Browser Tests

- Chrome mobile
- Safari mobile
- Chrome desktop
- Safari desktop

## Performance Gut Check

- First load should feel quick on mobile data.
- Images should not load as a blank wall for ages.
- No horizontal scrolling.
- No console errors.
