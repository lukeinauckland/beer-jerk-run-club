# Decision Log

## Current Product Goal

Help people discover Beer Jerk Run Club and confidently turn up.

The site must answer quickly:

- What is this?
- Is it for me?
- When is the next run?
- Where do I go?
- Do I need to sign up?
- What pace is it?
- What happens after?

## Decisions Made

### Use Vercel + Hover

Luke already has GitHub and Vercel. Hover is fine for the domain. Vercel is the simplest deployment path from GitHub.

### Keep The Site Static

The site is generated as static HTML. Key content is visible before JavaScript runs. This is better for search, AI crawlers, speed and maintenance.

### Add Focused Static Pages

Added:

- `/new-runners`
- `/schedule`
- `/routes`
- `/afters`

Reason: these are clean search and AI targets, without adding a CMS.

### Move Photos Below Practical Info

The earlier mockup put social proof very high. For launch, that is less important than schedule, routes and first-timer confidence.

Homepage order now prioritises:

1. Next run
2. Quick actions
3. What it is
4. New runner basics
5. Schedule
6. Routes / Afters
7. Photos
8. FAQ

### Drop Streak Board For Launch

Reason:

- fake data risk
- update burden
- lower relevance for first-timers

The dormant data shape remains for later.

### Do Not Feature Half Marathon

Reason: next one is around 11 months away. It should not distract launch visitors or carry stale ticket links.

### Keep Meetup Out Of Live Links

The live site does not link Meetup. Internal docs still mention reviewing Meetup because it may still be useful for SEO during transition.

## Not Perfect Yet

The site still needs rendered QA:

- mobile
- desktop
- Vercel preview
- live domain
- Lighthouse
- Rich Results Test

Do not call the site launch-ready until the rendered preview is checked.
