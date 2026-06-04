# Image Replacement Guide

Use this when replacing photos before or after launch.

## Where Images Live

Source images live in:

```text
assets/
```

The production build copies and optimises them into:

```text
production/dist/assets/
```

Do not edit files inside `dist/assets` directly. They are regenerated.

## Replace A Hero Image

1. Put the new image in `assets/`.
2. Use a simple filename, for example:

```text
hero-rain-briefing.jpg
```

3. Edit:

```text
production/content/site.json
```

4. Update the relevant item in:

```text
images.hero
```

5. Write a useful alt text. Describe the image plainly.
6. Run:

```sh
npm run check
```

## Replace Wall Photos

Edit:

```text
images.wall
```

Keep enough photos for the wall to feel full. Avoid near-identical repeats.

## Replace Route Maps

Edit each route's:

```text
map
```

Route maps can be smaller than photos. Keep them legible on mobile.

## Replace The Social Share Image

The OG share image is currently generated at build time as:

```text
production/dist/og-image.png
```

It uses Tinny, the logo and the launch facts. If you want a custom designed one, add it to `production/public/og-image.png` and adjust the build script to copy that instead of generating one.

## Image Rules

- Use JPG for photos.
- Use PNG for transparent art.
- Use SVG for logos where possible.
- Avoid spaces in filenames.
- Keep faces and recognisable people in mind.
- After any image change, run `npm run check`.
