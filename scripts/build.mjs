import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const workspace = path.resolve(root, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'content', 'site.json'), 'utf8'));
const imageDimensionManifest = JSON.parse(fs.readFileSync(path.join(root, 'content', 'image-dimensions.json'), 'utf8'));
const dist = path.join(root, 'dist');
const distAssets = path.join(dist, 'assets');
const publicDir = path.join(root, 'public');
const sourceAssets = path.join(root, 'assets');
const responsiveManifest = new Map();
const dimensionCache = new Map();

const now = process.env.BUILD_DATE ? new Date(process.env.BUILD_DATE) : new Date();
const siteUrl = data.site.url.replace(/\/$/, '');

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(distAssets, { recursive: true });

if (fs.existsSync(publicDir)) {
  for (const file of fs.readdirSync(publicDir)) {
    fs.copyFileSync(path.join(publicDir, file), path.join(dist, file));
  }
}

function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function attr(value = '') {
  return esc(value);
}

function isoDate(date) {
  return dateKey(date);
}

function timezoneOffset(date) {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const hours = String(Math.floor(abs / 60)).padStart(2, '0');
  const minutes = String(abs % 60).padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
}

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function shortDate(date) {
  return `${date.getDate()} ${monthNames[date.getMonth()]}`;
}

function longDate(date) {
  return `${dayNames[date.getDay()]} ${date.getDate()} ${fullMonthNames[date.getMonth()]}`;
}

function parseLocalDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isChristmasBreak(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const rule = data.schedule.christmasBreak;
  return (month === rule.startMonth && day >= rule.startDay) || (month === rule.endMonth && day <= rule.endDay);
}

function firstSaturday(year, monthIndex) {
  const date = new Date(year, monthIndex, 1);
  const offset = (6 - date.getDay() + 7) % 7;
  return addDays(date, offset);
}

const activeRoutes = data.routes.filter(route => route.status === 'active');
const anchorMonday = parseLocalDate(data.schedule.anchorMonday);

function routeForMonday(monday) {
  const weeks = Math.round((startOfDay(monday) - anchorMonday) / (7 * 24 * 60 * 60 * 1000));
  const index = ((weeks % activeRoutes.length) + activeRoutes.length) % activeRoutes.length;
  return activeRoutes[index];
}

function nextMondayFrom(date) {
  const today = startOfDay(date);
  let offset = (1 - today.getDay() + 7) % 7;
  const runPassed = offset === 0 && (date.getHours() > 17 || (date.getHours() === 17 && date.getMinutes() >= 40));
  if (runPassed) offset = 7;
  return addDays(today, offset);
}

function mondayEvent(monday) {
  const holiday = data.schedule.publicHolidays[dateKey(monday)];
  const runDate = holiday ? addDays(monday, 1) : monday;
  const route = routeForMonday(monday);
  return {
    type: 'monday',
    date: runDate,
    sortDate: runDate,
    route: route.scheduleName || route.name,
    km: route.distance,
    note: holiday || ''
  };
}

function buildEvents(date) {
  const events = [];
  let monday = nextMondayFrom(date);
  while (events.length < 12) {
    if (!isChristmasBreak(monday)) events.push(mondayEvent(monday));
    monday = addDays(monday, 7);
  }

  const afters = [];
  for (let i = 0; i < 5; i++) {
    const d = firstSaturday(date.getFullYear(), date.getMonth() + i);
    if (d >= startOfDay(date) && !isChristmasBreak(d)) {
      afters.push({
        type: 'afters',
        date: d,
        sortDate: d,
        route: `${data.afters.name} · Saturday long run`,
        km: `${data.afters.distance} / ${data.afters.total}`,
        note: ''
      });
    }
  }

  return [...events, ...afters]
    .sort((a, b) => a.sortDate - b.sortDate)
    .slice(0, data.schedule.lookaheadCount);
}

const events = buildEvents(now);
const nextEvent = events[0];
const nextStructuredRun = events.find(event => event.type === 'monday') || nextEvent;

function optimiseOrCopyAsset(file) {
  const from = path.join(sourceAssets, file);
  const to = path.join(distAssets, file);
  if (!fs.existsSync(from)) throw new Error(`Missing asset: ${file}`);

  const ext = path.extname(file).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
    fs.copyFileSync(from, to);
    return;
  }

  const maxWidths = {
    'embedded_01.jpg': 1600,
    'embedded_02.jpg': 1400,
    'embedded_03.jpg': 1200,
    'embedded_04.jpg': 1600,
    'embedded_05.jpg': 1600,
    'embedded_10.jpg': 1400
  };
  const maxWidth = maxWidths[file] || (file.startsWith('embedded_') ? 900 : 1200);

  try {
    const tmp = `${to}.tmp${ext}`;
    execFileSync('sips', ['-Z', String(maxWidth), '-s', 'formatOptions', '72', from, '--out', tmp], { stdio: 'ignore' });
    const originalSize = fs.statSync(from).size;
    const optimisedSize = fs.statSync(tmp).size;
    if (optimisedSize < originalSize) {
      fs.renameSync(tmp, to);
    } else {
      fs.rmSync(tmp, { force: true });
      fs.copyFileSync(from, to);
    }
  } catch {
    fs.copyFileSync(from, to);
  }
}

function responsiveName(file, width) {
  const ext = path.extname(file);
  const base = path.basename(file, ext);
  return `${base}-${width}${ext}`;
}

function imageDimensions(file) {
  if (dimensionCache.has(file)) return dimensionCache.get(file);
  let width = imageDimensionManifest[file]?.width || 0;
  let height = imageDimensionManifest[file]?.height || 0;
  try {
    const output = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', path.join(sourceAssets, file)], { encoding: 'utf8' });
    width = Number(output.match(/pixelWidth:\s*(\d+)/)?.[1] || width);
    height = Number(output.match(/pixelHeight:\s*(\d+)/)?.[1] || height);
  } catch {
    // Vercel runs on Linux, where macOS sips is unavailable. Use the committed manifest there.
  }
  const dimensions = { width, height };
  dimensionCache.set(file, dimensions);
  return dimensions;
}

function generateResponsiveAsset(file, widths) {
  const from = path.join(sourceAssets, file);
  if (!fs.existsSync(from) || !/\.(jpe?g|png)$/i.test(file)) return;

  const { width: originalWidth } = imageDimensions(file);
  const variants = [];

  for (const width of widths.filter(w => w <= originalWidth)) {
    const outFile = responsiveName(file, width);
    const outPath = path.join(distAssets, outFile);
    try {
      execFileSync('sips', ['-Z', String(width), '-s', 'formatOptions', '72', from, '--out', outPath], { stdio: 'ignore' });
      variants.push({ file: outFile, width });
    } catch {
      fs.copyFileSync(from, outPath);
      variants.push({ file: outFile, width });
    }
  }

  if (variants.length) {
    responsiveManifest.set(file, variants);
  }
}

function writeOgImage() {
  const source = path.join(sourceAssets, 'BJRC_Half_Back.png');
  const pngPath = path.join(dist, data.images.ogGenerated);
  const tmp = path.join(dist, 'og-image-crop.tmp.png');
  try {
    execFileSync('sips', ['--cropToHeightWidth', '1554', '2959', source, '--out', tmp], { stdio: 'ignore' });
    execFileSync('sips', ['-z', '630', '1200', tmp, '--out', pngPath], { stdio: 'ignore' });
    fs.rmSync(tmp, { force: true });
  } catch {
    fs.rmSync(tmp, { force: true });
    fs.copyFileSync(source, pngPath);
  }
}

function responsiveAttrs(file, sizes) {
  const variants = responsiveManifest.get(file);
  if (!variants?.length) return '';
  const srcset = variants.map(variant => `assets/${variant.file} ${variant.width}w`).join(', ');
  return ` srcset="${attr(srcset)}" sizes="${attr(sizes)}"`;
}

function imageSrc(file) {
  const variants = responsiveManifest.get(file);
  if (!variants?.length) return `assets/${file}`;
  const middle = variants[Math.min(1, variants.length - 1)];
  return `assets/${middle.file}`;
}

function dimensionAttrs(file) {
  if (!/\.(jpe?g|png)$/i.test(file)) return '';
  const { width, height } = imageDimensions(file);
  if (!width || !height) return '';
  return ` width="${width}" height="${height}"`;
}

function eagerImg({ file, alt, sizes, className = '', extra = '' }) {
  return `<img${className ? ` class="${attr(className)}"` : ''} src="${attr(imageSrc(file))}"${responsiveAttrs(file, sizes)}${dimensionAttrs(file)} alt="${attr(alt)}" decoding="async"${extra}>`;
}

function deferredImg({ file, alt, sizes, className = '', extra = '' }) {
  const variants = responsiveManifest.get(file);
  const srcset = variants?.length ? variants.map(variant => `assets/${variant.file} ${variant.width}w`).join(', ') : '';
  return `<img${className ? ` class="${attr(className)}"` : ''} data-src="${attr(imageSrc(file))}"${srcset ? ` data-srcset="${attr(srcset)}"` : ''} data-sizes="${attr(sizes)}"${dimensionAttrs(file)} alt="${attr(alt)}" decoding="async" loading="lazy"${extra}>`;
}

const assetSet = new Set([
  data.images.logo,
  data.images.tinny,
  ...data.routes.map(route => route.map)
]);

for (const file of assetSet) optimiseOrCopyAsset(file);

data.images.hero.forEach((image, index) => {
  generateResponsiveAsset(image.file, index === 0 ? [640, 1100, 1500] : [640, 1100]);
});
generateResponsiveAsset(data.images.crowd.file, [640, 1100]);
for (const post of data.images.instagramPreview.posts) generateResponsiveAsset(post.file, [360, 640]);
for (const file of data.images.wall) generateResponsiveAsset(file, [360, 640]);
writeOgImage();

function scheduleRows() {
  return events.map((event, index) => {
    const classes = ['schedule-row'];
    if (index === 0) classes.push('next');
    if (event.type === 'afters') classes.push('afters-row');
    if (event.note) classes.push('holiday-shift');
    const shift = event.note ? `<span class="shift-note">(${esc(event.note)})</span>` : '';
    const badge = index === 0 ? '<span class="next-badge">Next</span>' : '';
    return `
      <div class="${classes.join(' ')}">
        <span class="schedule-date">${esc(shortDate(event.date))}<span class="schedule-day">${esc(dayNames[event.date.getDay()])}${shift}</span></span>
        <span class="schedule-route">${esc(event.route)} <span class="km">${esc(event.km)}</span>${badge}</span>
      </div>`;
  }).join('\n');
}

function nextEventSubline(event) {
  if (event.type === 'afters') {
    return `${event.km} · ${data.afters.start} · Meet from ${data.afters.meet}`;
  }
  return `${event.km} · ${data.schedule.runStart} · Bag drop from ${data.schedule.bagDrop}${event.note ? ' · Tuesday shift' : ''}`;
}

function nextEventLabel(event) {
  return event.type === 'afters' ? 'Event' : 'Route';
}

function jsonLd() {
  const placeId = `${siteUrl}/#small-gods`;
  const orgId = `${siteUrl}/#club`;
  const nextRunId = `${siteUrl}/#next-run`;
  const scheduleId = `${siteUrl}/#monday-schedule`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: data.site.name,
        url: siteUrl,
        inLanguage: data.site.language,
        description: data.site.description
      },
      {
        '@type': ['Organization', 'SportsOrganization'],
        '@id': orgId,
        name: data.site.name,
        alternateName: data.site.shortName,
        url: siteUrl,
        description: data.club.oneLine,
        foundingDate: data.site.founded,
        sameAs: [data.links.instagram, data.links.strava, data.links.beerJerk],
        areaServed: {
          '@type': 'City',
          name: 'Auckland'
        },
        keywords: [
          'Auckland run club',
          'Auckland running club',
          'social running club Auckland',
          'beginner friendly run club Auckland',
          'Monday run club Auckland',
          '5km run club Auckland'
        ],
        location: { '@id': placeId }
      },
      {
        '@type': 'SportsActivityLocation',
        '@id': placeId,
        name: data.location.name,
        url: data.links.smallGods,
        address: {
          '@type': 'PostalAddress',
          streetAddress: data.location.street,
          addressLocality: data.location.city,
          addressRegion: data.location.city,
          addressCountry: data.location.country
        },
        containedInPlace: {
          '@type': 'City',
          name: 'Auckland'
        }
      },
      {
        '@type': 'SportsEvent',
        '@id': nextRunId,
        name: `${data.site.name} Monday Run`,
        description: data.site.description,
        startDate: `${isoDate(nextStructuredRun.date)}T17:40:00${timezoneOffset(nextStructuredRun.date)}`,
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'NZD',
          availability: 'https://schema.org/InStock',
          url: siteUrl
        },
        organizer: { '@id': orgId },
        location: { '@id': placeId },
        sport: 'Running',
        keywords: 'Auckland run club, social running club, beginner friendly run club, 5km run club, Monday run club',
        eventSchedule: { '@id': scheduleId }
      },
      {
        '@type': 'Schedule',
        '@id': scheduleId,
        repeatFrequency: 'P1W',
        byDay: 'https://schema.org/Monday',
        startTime: '17:40',
        scheduleTimezone: 'Pacific/Auckland',
        exceptDate: Object.keys(data.schedule.publicHolidays)
      },
      {
        '@type': 'FAQPage',
        '@id': `${siteUrl}/#faq`,
        mainEntity: data.faq.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer
          }
        }))
      }
    ]
  };
}

function styles() {
  return `
  :root {
    --red: #EC1C24;
    --red-light: #FCE6E7;
    --ink: #111111;
    --paper: #F5F2EA;
    --paper-warm: #FBF5E9;
    --grey: #636363;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: var(--paper);
    color: var(--ink);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 16px;
    line-height: 1.5;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }
  .skip-link {
    position: absolute;
    left: 12px;
    top: -60px;
    z-index: 100;
    background: var(--ink);
    color: var(--paper);
    padding: 10px 14px;
    text-decoration: none;
  }
  .skip-link:focus { top: 12px; }
  img { max-width: 100%; display: block; }
  a { color: inherit; text-decoration-thickness: 2px; text-underline-offset: 3px; }
  a:focus-visible, button:focus-visible { outline: 3px solid var(--red); outline-offset: 3px; }
  .display {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 900;
    font-style: italic;
    text-transform: uppercase;
    letter-spacing: 0;
  }
  .topbar {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(245,242,234,0.96);
    border-bottom: 1px solid var(--ink);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 10px 24px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 900;
    font-size: 18px;
    text-transform: uppercase;
    text-decoration: none;
  }
  .brand img { width: 40px; height: 40px; object-fit: contain; }
  .nav {
    display: flex;
    gap: 18px;
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 800;
    font-size: 15px;
    text-transform: uppercase;
  }
  .nav a { text-decoration: none; }
  .nav a:hover { color: var(--red); }
  .top-tag {
    color: var(--grey);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .next-run {
    background: var(--red);
    color: var(--paper);
    border-bottom: 1px solid var(--ink);
    display: grid;
    grid-template-columns: 1fr 1.1fr 2fr;
  }
  .next-run > div {
    padding: 22px 28px;
    border-right: 1px solid rgba(245,242,234,0.32);
  }
  .next-run > div:last-child { border-right: 0; }
  .eyebrow {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 800;
    font-size: 13px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  .muted { color: var(--grey); }
  .next-run .sub {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 800;
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    opacity: 0.78;
    margin-top: 4px;
  }
  .nr-big {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 900;
    font-style: italic;
    text-transform: uppercase;
    font-size: clamp(40px, 6vw, 70px);
    line-height: 0.9;
  }
  .hero {
    position: relative;
    min-height: clamp(590px, 88svh, 860px);
    background: var(--ink);
    overflow: hidden;
  }
  .hero-stack, .hero-slide { position: absolute; inset: 0; }
  .hero-slide { opacity: 0; transition: opacity 900ms ease; }
  .hero-slide.active { opacity: 1; }
  .hero-slide img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(1) contrast(1.1) brightness(0.82);
  }
  .hero-slide.colour img { filter: contrast(1.02) brightness(0.92); }
  .hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.28) 45%, rgba(0,0,0,0.78));
  }
  .hero-content {
    position: absolute;
    inset: auto 0 0 0;
    z-index: 2;
    color: var(--paper);
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 28px;
    align-items: end;
    padding: 42px 32px 46px;
  }
  .hero h1 {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 900;
    font-style: italic;
    font-size: clamp(76px, 14vw, 205px);
    line-height: 0.84;
    text-transform: uppercase;
  }
  .hero .red { color: var(--red); }
  .hero h1 .red { display: block; }
  .hero-intro {
    max-width: 680px;
    font-size: clamp(18px, 2.2vw, 24px);
    line-height: 1.35;
    margin-top: 18px;
  }
  .tinny {
    width: clamp(92px, 13vw, 176px);
    transform: rotate(-8deg);
    filter: drop-shadow(0 4px 14px rgba(0,0,0,0.48));
  }
  .hero-dots {
    position: absolute;
    right: 22px;
    bottom: 20px;
    z-index: 3;
    display: flex;
    gap: 8px;
  }
  .hero-dot {
    width: 8px;
    height: 8px;
    border-radius: 99px;
    background: rgba(245,242,234,0.45);
  }
  .hero-dot.active { background: var(--paper); }
  .strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border-bottom: 1px solid var(--ink);
  }
  .strip-item {
    min-height: 230px;
    padding: 28px 24px 32px;
    border-right: 1px solid var(--ink);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .strip-item:last-child { border-right: 0; }
  .strip h2, .strip h3 {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 900;
    font-style: italic;
    font-size: clamp(38px, 5vw, 58px);
    line-height: 0.9;
    text-transform: uppercase;
  }
  .strip p { margin-top: auto; }
  .beer-card { background: var(--red); color: var(--paper); }
  .insta-preview {
    display: grid;
    grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.6fr);
    background: var(--paper);
  }
  .insta-copy {
    padding: 34px 32px;
    border-right: 1px solid var(--ink);
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 18px;
  }
  .insta-copy h2 {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 900;
    font-style: italic;
    font-size: clamp(46px, 7vw, 88px);
    line-height: 0.86;
    text-transform: uppercase;
  }
  .insta-copy p {
    max-width: 520px;
    font-size: clamp(18px, 2vw, 22px);
    line-height: 1.35;
  }
  .insta-follow {
    width: fit-content;
    background: var(--red);
    color: var(--paper);
    border: 1px solid var(--ink);
    padding: 12px 16px;
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 900;
    font-style: italic;
    font-size: 24px;
    line-height: 1;
    text-transform: uppercase;
    text-decoration: none;
  }
  .insta-follow:hover { background: var(--ink); color: var(--paper); }
  .insta-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    border-left: 0;
  }
  .insta-card {
    position: relative;
    aspect-ratio: 4 / 5;
    overflow: hidden;
    border-right: 1px solid var(--ink);
    color: var(--ink);
    text-decoration: none;
    background: var(--paper);
    padding: 38px 10px 72px;
  }
  .insta-card:last-child { border-right: 0; }
  .insta-card::before {
    content: '@beerjerkrunclub';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 38px;
    display: flex;
    align-items: center;
    padding: 0 12px 0 42px;
    border-bottom: 1px solid var(--ink);
    background:
      radial-gradient(circle at 20px 50%, var(--red) 0 7px, transparent 8px),
      var(--paper);
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 900;
    font-style: italic;
    font-size: 18px;
    text-transform: uppercase;
  }
  .insta-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: contrast(1.03) brightness(0.9);
    transform: scale(1.01);
    transition: transform 180ms ease, filter 180ms ease;
  }
  .insta-card:hover img {
    transform: scale(1.045);
    filter: contrast(1.06) brightness(0.98);
  }
  .insta-caption {
    position: absolute;
    z-index: 1;
    left: 0;
    right: 0;
    bottom: 0;
    min-height: 72px;
    padding: 11px 12px 12px;
    border-top: 1px solid var(--ink);
    background: var(--paper);
    font-size: 14px;
    line-height: 1.25;
    color: var(--ink);
  }
  .section {
    border-bottom: 1px solid var(--ink);
  }
  .crowd-strip,
  .links,
  footer {
    content-visibility: auto;
    contain-intrinsic-size: auto 900px;
  }
  .section-head {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 22px;
    align-items: end;
    padding: 42px 32px 26px;
    border-bottom: 1px solid var(--ink);
  }
  .section-num {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 900;
    font-style: italic;
    font-size: clamp(64px, 10vw, 104px);
    line-height: 0.75;
    color: var(--red);
  }
  .section-head.plain {
    display: block;
    padding: 42px 32px 26px;
  }
  .section-head.plain .section-title {
    max-width: 980px;
  }
  .section-title {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 900;
    font-style: italic;
    font-size: clamp(42px, 8vw, 88px);
    line-height: 0.86;
    text-transform: uppercase;
  }
  .section-title .light { color: var(--grey); }
  .content-copy {
    max-width: 860px;
    padding: 26px 32px 32px;
    font-size: clamp(18px, 2vw, 22px);
    line-height: 1.45;
  }
  .crowd-strip img {
    width: 100%;
    height: clamp(330px, 54vh, 560px);
    object-fit: cover;
  }
  .wall {
    display: flex;
    flex-wrap: wrap;
    background: var(--paper);
  }
  .wall-tile {
    flex: 1 0 25%;
    aspect-ratio: 4/5;
    overflow: hidden;
    background: var(--ink);
  }
  .wall-feature { flex-basis: 50%; }
  .wall img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(1) contrast(1.12) sepia(0.08) hue-rotate(165deg) saturate(1.2);
  }
  .wall-feature img { filter: grayscale(1) contrast(1.12) sepia(0.08) hue-rotate(165deg) saturate(1.2); }
  .schedule { background: var(--red-light); }
  .schedule-list { padding: 10px 32px 28px; }
  .schedule-row {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: baseline;
    gap: 18px;
    padding: 16px 0;
    border-bottom: 1px solid rgba(236,28,36,0.25);
  }
  .schedule-row.next {
    background: var(--paper-warm);
    margin: 0 -16px;
    padding-left: 16px;
    padding-right: 16px;
    border-radius: 4px;
  }
  .schedule-date, .schedule-route, .km, .next-badge, .route-num, .link-label, footer h2, footer h5 {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    text-transform: uppercase;
  }
  .schedule-date {
    font-weight: 900;
    font-style: italic;
    font-size: clamp(30px, 4vw, 42px);
    color: var(--red);
    line-height: 1;
  }
  .schedule-day, .shift-note {
    display: block;
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 800;
    font-style: normal;
    font-size: 13px;
    letter-spacing: 0.13em;
    color: var(--ink);
    margin-top: 4px;
  }
  .shift-note {
    color: var(--grey);
    letter-spacing: 0.04em;
    text-transform: none;
  }
  .schedule-route {
    font-weight: 900;
    font-style: italic;
    font-size: clamp(32px, 5vw, 56px);
    color: var(--red);
    text-align: right;
    line-height: 1;
  }
  .schedule-route .km {
    display: inline-block;
    margin-left: 10px;
    vertical-align: 0.08em;
  }
  .schedule-row.afters-row .schedule-route, .schedule-row.afters-row .schedule-date { color: var(--ink); }
  .km {
    font-weight: 800;
    font-size: 14px;
    letter-spacing: 0.1em;
    color: var(--grey);
    min-width: 76px;
    text-align: right;
  }
  .next-badge {
    display: inline-block;
    background: var(--red);
    color: var(--paper);
    padding: 2px 8px;
    font-weight: 800;
    font-size: 11px;
    letter-spacing: 0.18em;
    margin-left: 10px;
    vertical-align: middle;
  }
  .note {
    padding: 0 32px 34px;
    color: var(--grey);
    max-width: 820px;
  }
  .routes-intro {
    padding: 24px 32px 28px;
    max-width: 860px;
    color: var(--grey);
    font-size: 18px;
  }
  .routes-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-top: 1px solid var(--ink);
  }
  .route {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 330px;
    border-right: 1px solid var(--ink);
    border-bottom: 1px solid var(--ink);
    position: relative;
  }
  .route:nth-child(2n) { border-right: 0; }
  .route-info {
    padding: 28px 26px 30px;
    border-right: 1px solid var(--ink);
    background: var(--paper);
  }
  .route-num {
    display: block;
    color: var(--red);
    font-weight: 800;
    font-size: 12px;
    letter-spacing: 0.18em;
    margin-bottom: 20px;
  }
  .route-name {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 900;
    font-style: italic;
    font-size: clamp(36px, 5vw, 54px);
    line-height: 0.9;
    color: var(--red);
    text-transform: uppercase;
    margin-bottom: 16px;
  }
  .route-desc { font-size: 14px; line-height: 1.55; }
  .route-map {
    position: relative;
    min-height: 220px;
    background: #ddd;
    overflow: hidden;
  }
  .route-map img { width: 100%; height: 100%; object-fit: cover; }
  .stamp {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 2;
    background: var(--paper);
    border: 1px solid var(--ink);
    padding: 4px 10px;
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 800;
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .route.skipped { opacity: 0.66; }
  .route.skipped::after {
    content: 'SKIPPED IN WINTER';
    position: absolute;
    inset: 50% auto auto 50%;
    transform: translate(-50%, -50%) rotate(-8deg);
    background: var(--paper);
    border: 2px solid var(--red);
    color: var(--red);
    padding: 6px 16px;
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 900;
    font-style: italic;
    font-size: clamp(28px, 4.6vw, 52px);
    white-space: nowrap;
    text-transform: uppercase;
    z-index: 4;
  }
  .afters-card {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 1.35fr 0.85fr;
    background: var(--ink);
    color: var(--paper);
    border-bottom: 1px solid var(--ink);
  }
  .afters-card .route-info {
    background: var(--ink);
    color: var(--paper);
    border-right-color: var(--paper);
  }
  .afters-card .route-name { color: var(--paper); font-size: clamp(58px, 8vw, 98px); }
  .afters-card .route-name .red { color: var(--red); }
  .afters-graphic {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
    min-height: 260px;
    padding: 34px;
    background: var(--red);
    text-align: center;
    font-family: 'Barlow Condensed', Impact, sans-serif;
    color: var(--paper);
    text-transform: uppercase;
  }
  .afters-graphic .day {
    font-weight: 900;
    font-style: italic;
    font-size: clamp(58px, 8vw, 100px);
    line-height: 0.85;
  }
  .afters-graphic .of {
    font-weight: 800;
    letter-spacing: 0.13em;
  }
  .afters-graphic .distance {
    font-weight: 900;
    font-style: italic;
    font-size: clamp(34px, 5vw, 58px);
    letter-spacing: 0.08em;
  }
  .faq-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-top: 1px solid var(--ink);
  }
  .faq-item {
    padding: 26px 28px 30px;
    border-right: 1px solid var(--ink);
    border-bottom: 1px solid var(--ink);
  }
  .faq-item:nth-child(2n) { border-right: 0; }
  .faq-item h3 {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 900;
    font-style: italic;
    font-size: 34px;
    line-height: 0.95;
    text-transform: uppercase;
    margin-bottom: 14px;
  }
  .links {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    background: var(--ink);
    color: var(--paper);
  }
  .link-cell {
    min-height: 190px;
    padding: 34px 32px;
    border-right: 1px solid #333;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .link-cell:last-child { border-right: 0; }
  .link-cell:nth-child(2) { background: #172c44; }
  .link-cell:nth-child(3) { background: #4d1212; }
  .link-label {
    color: rgba(245,242,234,0.68);
    font-weight: 800;
    font-size: 14px;
    letter-spacing: 0.18em;
    margin-bottom: 18px;
  }
  .link-name {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 900;
    font-style: italic;
    font-size: clamp(44px, 6vw, 70px);
    line-height: 0.9;
    text-transform: uppercase;
  }
  .arrow { float: right; font-style: normal; }
  footer {
    position: relative;
    overflow: hidden;
    padding: 64px 32px 28px;
  }
  footer h2 {
    font-weight: 900;
    font-style: italic;
    font-size: clamp(72px, 13vw, 180px);
    line-height: 0.84;
  }
  footer .red { color: var(--red); }
  .footer-tinny {
    position: absolute;
    width: clamp(120px, 20vw, 230px);
    right: 32px;
    top: 70px;
    opacity: 0.7;
    filter: grayscale(1);
  }
  .footer-grid {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 34px;
    margin-top: 42px;
  }
  footer h5 {
    color: var(--red);
    font-weight: 800;
    font-size: 14px;
    letter-spacing: 0.18em;
    margin-bottom: 14px;
  }
  footer a { display: block; text-decoration: none; margin-bottom: 7px; }
  .footer-bottom {
    border-top: 1px solid var(--ink);
    margin-top: 42px;
    padding-top: 18px;
    display: flex;
    justify-content: space-between;
    gap: 20px;
    color: var(--grey);
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-weight: 800;
    font-size: 13px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  @media (max-width: 980px) {
    .strip { grid-template-columns: repeat(2, 1fr); }
    .strip-item:nth-child(2n) { border-right: 0; }
    .insta-preview { grid-template-columns: 1fr; }
    .insta-copy { border-right: 0; border-bottom: 1px solid var(--ink); }
    .wall-tile { flex-basis: 33.333%; }
    .wall-feature { flex-basis: 66.666%; }
    .routes-grid { grid-template-columns: 1fr; }
    .route { border-right: 0; }
    .route:nth-child(2n) { border-right: 0; }
    .footer-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 720px) {
    .nav, .top-tag { display: none; }
    .topbar { padding: 8px 14px; }
    .brand { font-size: 16px; }
    .brand img { width: 34px; height: 34px; }
    .next-run { grid-template-columns: 1fr; }
    .next-run > div { border-right: 0; border-bottom: 1px solid rgba(245,242,234,0.32); padding: 16px 20px; }
    .hero { min-height: 660px; }
    .hero-content { grid-template-columns: 1fr; padding: 30px 22px 42px; }
    .tinny { justify-self: end; }
    .section-head { grid-template-columns: 1fr; padding: 30px 22px 20px; gap: 14px; }
    .content-copy, .routes-intro, .note { padding-left: 22px; padding-right: 22px; }
    .strip { grid-template-columns: 1fr; }
    .strip-item { border-right: 0; border-bottom: 1px solid var(--ink); min-height: 220px; padding: 26px 22px; }
    .insta-copy { padding: 30px 22px; }
    .insta-grid { grid-template-columns: 1fr; }
    .insta-card { aspect-ratio: 1 / 1; border-right: 0; border-bottom: 1px solid var(--ink); }
    .wall-tile { flex-basis: 50%; }
    .wall-feature { flex-basis: 100%; aspect-ratio: 16 / 11; }
    .schedule-list { padding: 10px 22px 28px; }
    .schedule-row { grid-template-columns: 1fr; align-items: start; gap: 8px; padding: 18px 0; }
    .schedule-route { text-align: left; }
    .schedule-route .km { display: block; margin: 5px 0 0; }
    .route, .afters-card { grid-template-columns: 1fr; }
    .route-info { border-right: 0; border-bottom: 1px solid var(--ink); padding: 24px 22px 26px; }
    .route.skipped::after { top: 18px; right: 16px; left: auto; transform: rotate(-6deg); font-size: 22px; white-space: normal; max-width: 180px; text-align: center; }
    .afters-card .route-info { border-bottom-color: var(--paper); }
    .faq-list, .links { grid-template-columns: 1fr; }
    .faq-item { border-right: 0; padding: 24px 22px 28px; }
    .link-cell { min-height: 160px; padding: 28px 24px; border-right: 0; border-bottom: 1px solid #333; }
    footer { padding: 52px 22px 24px; }
    .footer-tinny { width: 130px; top: 28px; right: -10px; opacity: 0.5; }
    .footer-grid { grid-template-columns: 1fr; gap: 24px; }
    .footer-bottom { flex-direction: column; }
  }`;
}

function faqItems() {
  return data.faq.map(item => `
    <article class="faq-item">
      <h3>${esc(item.question)}</h3>
      <p>${esc(item.answer)}</p>
    </article>`).join('\n');
}

function routeCards() {
  return data.routes.map((route, index) => `
    <article class="route ${route.status === 'winter-skip' ? 'skipped' : ''}">
      <div class="route-info">
        <span class="route-num">- Route ${String(index + 1).padStart(2, '0')}</span>
        <h3 class="route-name">${esc(route.name).replace(' / ', '<br>')}</h3>
        <p class="route-desc">${esc(route.description)}</p>
      </div>
      <div class="route-map">
        <span class="stamp">${esc(route.distance)}</span>
        <img src="assets/${attr(route.map)}"${dimensionAttrs(route.map)} alt="${attr(`${route.name} route map`)}" loading="lazy" decoding="async">
      </div>
    </article>`).join('\n');
}

function wallTiles() {
  return data.images.wall.map((file, index) => `
    <div class="wall-tile ${index === 4 ? 'wall-feature' : ''}">
      ${eagerImg({
        file,
        sizes: index === 4 ? '(max-width: 720px) 100vw, 50vw' : '(max-width: 720px) 50vw, (max-width: 980px) 33vw, 25vw',
        alt: `${data.site.name} runner photo ${index + 1}`,
        extra: ' loading="lazy"'
      })}
    </div>`).join('\n');
}

function instagramPreview() {
  const preview = data.images.instagramPreview;
  return `<section class="section insta-preview" aria-labelledby="instagram-heading">
    <div class="insta-copy">
      <div class="eyebrow muted">Instagram</div>
      <h2 id="instagram-heading">${esc(preview.heading)}</h2>
      <p>${esc(preview.copy)}</p>
      <a class="insta-follow" href="${attr(data.links.instagram)}" target="_blank" rel="noopener">${esc(preview.cta)}</a>
    </div>
    <div class="insta-grid">
      ${preview.posts.map((post, index) => `<a class="insta-card" href="${attr(data.links.instagram)}" target="_blank" rel="noopener" aria-label="${attr(`${preview.cta}: ${post.caption}`)}">
        ${eagerImg({
          file: post.file,
          sizes: '(max-width: 720px) 88vw, 24vw',
          alt: `${data.site.name} Instagram preview ${index + 1}`,
          extra: ' loading="lazy"'
        })}
        <span class="insta-caption">${esc(post.caption)}</span>
      </a>`).join('\n      ')}
    </div>
  </section>`;
}

function renderHtml() {
  return `<!DOCTYPE html>
<html lang="${attr(data.site.language)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(data.site.title)}</title>
<meta name="description" content="${attr(data.site.description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${siteUrl}/">
<meta property="og:title" content="${attr(data.site.name)} Auckland">
<meta property="og:description" content="${attr(data.site.description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${siteUrl}/">
<meta property="og:locale" content="${attr(data.site.locale)}">
<meta property="og:image" content="${siteUrl}/${attr(data.images.ogGenerated)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#EC1C24">
<meta name="author" content="${attr(data.site.name)}">
<meta name="geo.region" content="NZ-AUK">
<meta name="geo.placename" content="Auckland">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="sitemap" type="application/xml" href="/sitemap.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;0,900;1,800;1,900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">${JSON.stringify(jsonLd())}</script>
</head>
<body>
<a class="skip-link" href="#main">Skip to main content</a>
<header class="topbar">
  <a class="brand" href="${siteUrl}/" aria-label="${attr(data.site.name)} home">
    <img src="assets/${attr(data.images.logo)}" alt="${attr(data.site.name)} logo">
    <span>${esc(data.site.name)}</span>
  </a>
  <nav class="nav" aria-label="Main navigation">
    <a href="#new-here">New Here</a>
    <a href="#schedule">Schedule</a>
    <a href="#routes">Routes</a>
    <a href="#afters">AFTERS</a>
  </nav>
  <div class="top-tag">Est. ${esc(data.site.founded)} · Auckland</div>
</header>

<main id="main">
  <section class="hero">
    <div class="hero-stack" id="hero-stack">
      ${data.images.hero.map((image, index) => `<div class="hero-slide ${index === 0 ? 'active' : ''} ${index === 3 ? 'colour' : ''}">${index === 0
        ? eagerImg({ file: image.file, sizes: '100vw', alt: image.alt, extra: ' fetchpriority="high"' })
        : deferredImg({ file: image.file, sizes: '100vw', alt: image.alt })
      }</div>`).join('\n      ')}
    </div>
    <div class="hero-content">
      <div>
        <div class="eyebrow">Mondays · ${esc(data.schedule.runStart)} · ${esc(data.location.name)}</div>
        <h1>${esc(data.site.name)} <span class="red">Auckland.</span></h1>
        <p class="hero-intro">${esc(data.club.opening)}</p>
      </div>
      <img class="tinny" src="assets/${attr(data.images.tinny)}" alt="Tinny, the Beer Jerk Run Club mascot">
    </div>
    <div class="hero-dots" id="hero-dots" aria-hidden="true">
      ${data.images.hero.map((_, index) => `<span class="hero-dot ${index === 0 ? 'active' : ''}"></span>`).join('\n      ')}
    </div>
  </section>

  <section class="next-run" id="next-run" aria-label="Next run">
    <div>
      <div class="eyebrow">Next Run</div>
      <div class="sub">From ${esc(data.location.name)}</div>
    </div>
    <div>
      <div class="eyebrow">${esc(longDate(nextEvent.date))}</div>
      <div class="nr-big">${esc(shortDate(nextEvent.date))}</div>
    </div>
    <div>
      <div class="eyebrow">${esc(nextEventLabel(nextEvent))}</div>
      <div class="nr-big">${esc(nextEvent.route)}</div>
      <div class="sub">${esc(nextEventSubline(nextEvent))}</div>
    </div>
  </section>

  <section class="strip" id="how" aria-label="Key run club information">
    <article class="strip-item">
      <div class="eyebrow muted">What</div>
      <h2>5km<br>Social Run</h2>
      <p>${esc(data.club.pace)}<br><br>${esc(data.club.price)}</p>
    </article>
    <article class="strip-item">
      <div class="eyebrow muted">Where</div>
      <h2>Small Gods<br>Taproom</h2>
      <p>${esc(data.location.street)}, ${esc(data.location.suburb)} / Uptown. Bag drop is inside from ${esc(data.schedule.bagDrop)}. ${esc(data.club.parkingNote)}</p>
    </article>
    <article class="strip-item">
      <div class="eyebrow muted">When</div>
      <h2>Mondays<br>${esc(data.schedule.runStart)}</h2>
      <p>We run at ${esc(data.schedule.runStart)}. Bag drop from 5. ${esc(data.schedule.publicHolidayRule)}</p>
    </article>
    <article class="strip-item beer-card">
      <div class="eyebrow">After</div>
      <h2>Beer.<br>Or Not.</h2>
      <p>${esc(data.club.beerDeal)} Soft drinks, cider, wine and AF beers are there too.</p>
    </article>
  </section>

  ${instagramPreview()}

  <section class="section" id="new-here">
    <div class="section-head plain">
      <h2 class="section-title">New Here?</h2>
    </div>
    <p class="content-copy">${esc(data.club.audience)} Meet at ${esc(data.location.name)} from 5. ${esc(data.club.bagDropNote)} ${esc(data.club.newRunnerNote)}</p>
  </section>

  <section class="section schedule" id="schedule">
    <div class="section-head plain">
      <h2 class="section-title">Coming Up</h2>
    </div>
    <div class="schedule-list">${scheduleRows()}</div>
    <p class="note">${esc(data.schedule.publicHolidayRule)} ${esc(data.schedule.christmasRule)}</p>
  </section>

  <section class="section" id="routes">
    <div class="section-head plain">
      <h2 class="section-title">Routes</h2>
    </div>
    <p class="routes-intro">The Monday routes are 5km. ${esc(data.afters.name)} is our monthly long run on the first Saturday of the month: ${esc(data.afters.distance)} or ${esc(data.afters.total)}.</p>
    <div class="routes-grid">
      ${routeCards()}
      <article class="afters-card" id="afters">
        <div class="route-info">
          <span class="route-num">- Monthly Long Run</span>
          <h3 class="route-name"><span class="red">${esc(data.afters.name)}</span></h3>
          <p class="route-desc">${esc(data.afters.name)} is our monthly long run on the first Saturday. ${esc(data.afters.summary)} Meet from ${esc(data.afters.meet)}, run at ${esc(data.afters.start)}. Drinks after.</p>
        </div>
        <div class="afters-graphic">
          <div class="day">${esc(data.afters.name)}</div>
          <div class="of">Saturday long run</div>
          <div class="distance">${esc(data.afters.distance)} or ${esc(data.afters.total)}</div>
        </div>
      </article>
    </div>
  </section>

  <section class="section crowd-strip" aria-label="Beer Jerk Run Club crowd photo">
    ${eagerImg({ file: data.images.crowd.file, sizes: '100vw', alt: data.images.crowd.alt, extra: ' loading="lazy"' })}
  </section>

  <section class="section" id="wall">
    <div class="wall">${wallTiles()}</div>
  </section>

  <section class="section" id="faq">
    <div class="section-head plain">
      <h2 class="section-title">FAQ</h2>
    </div>
    <div class="faq-list">${faqItems()}</div>
  </section>

  <section class="links" aria-label="External links">
    <a class="link-cell" href="${attr(data.links.instagram)}" target="_blank" rel="noopener">
      <span class="link-label">- Follow</span>
      <span class="link-name">Instagram <span class="arrow">→</span></span>
    </a>
    <a class="link-cell" href="${attr(data.links.strava)}" target="_blank" rel="noopener">
      <span class="link-label">- Join</span>
      <span class="link-name">Strava Club <span class="arrow">→</span></span>
    </a>
    <a class="link-cell" href="${attr(data.location.mapUrl)}" target="_blank" rel="noopener">
      <span class="link-label">- Find</span>
      <span class="link-name">Small Gods <span class="arrow">→</span></span>
    </a>
  </section>
</main>

<footer>
  <h2>See you<br><span class="red">Monday.</span></h2>
  <img class="footer-tinny" src="assets/${attr(data.images.tinny)}" alt="Tinny running with a beer">
  <div class="footer-grid">
    <div>
      <h5>- The Club</h5>
      <p>${esc(data.site.name)}. ${esc(data.club.price)}</p>
      <p class="muted">${esc(data.location.name)}<br>${esc(data.location.street)}, ${esc(data.location.suburb)} / Uptown<br>${esc(data.location.city)}</p>
    </div>
    <div>
      <h5>- Hours</h5>
      <p>Mondays<br>${esc(data.schedule.bagDrop)} bag drop<br>${esc(data.schedule.runStart)} run</p>
      <p class="muted">${esc(data.schedule.publicHolidayRule)}<br>${esc(data.schedule.christmasRule)}</p>
    </div>
    <div>
      <h5>- Find Us</h5>
      <a href="${attr(data.links.instagram)}" target="_blank" rel="noopener">Instagram</a>
      <a href="${attr(data.links.strava)}" target="_blank" rel="noopener">Strava Club</a>
      <a href="${attr(data.links.beerJerk)}" target="_blank" rel="noopener">Beer Jerk</a>
      <a href="${attr(data.links.smallGods)}" target="_blank" rel="noopener">Small Gods</a>
    </div>
    <div>
      <h5>- Also</h5>
      <p>${esc(data.club.halfMarathonMention)}</p>
      <p class="muted">${esc(data.site.slogan)}</p>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© ${esc(data.site.shortName)} ${esc(data.site.founded)}-${String(now.getFullYear()).slice(-2)} · Made in Auckland</span>
    <span>${esc(data.site.slogan)}</span>
  </div>
</footer>

<script>
(function() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
  var index = 0;
  if (!slides.length) return;
  function hydrate(img) {
    if (!img || img.dataset.loaded) return;
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    if (img.dataset.sizes) img.sizes = img.dataset.sizes;
    if (img.dataset.src) img.src = img.dataset.src;
    img.dataset.loaded = 'true';
  }
  function hydrateAll() {
    Array.prototype.forEach.call(document.querySelectorAll('.hero-slide img[data-src]'), hydrate);
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(hydrateAll, { timeout: 1800 });
  } else {
    setTimeout(hydrateAll, 900);
  }
  function show(next) {
    hydrate(slides[next] && slides[next].querySelector('img'));
    slides[index].classList.remove('active');
    if (dots[index]) dots[index].classList.remove('active');
    index = next;
    slides[index].classList.add('active');
    if (dots[index]) dots[index].classList.add('active');
  }
  setInterval(function() { show((index + 1) % slides.length); }, 6000);
})();
</script>
</body>
</html>`;
}

function pageJsonLd({ slug, title, description }) {
  const pageUrl = `${siteUrl}/${slug}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: title,
        description,
        inLanguage: data.site.language,
        isPartOf: { '@id': `${siteUrl}/#website` },
        about: { '@id': `${siteUrl}/#club` }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumbs`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: data.site.name,
            item: siteUrl
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: title.replace(` | ${data.site.name} Auckland`, '').replace(` | ${data.site.name}`, ''),
            item: pageUrl
          }
        ]
      }
    ]
  };
}

function pageHead({ title, description, canonical, robots = 'index, follow, max-image-preview:large', jsonLdData = null }) {
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${attr(description)}">
<meta name="robots" content="${attr(robots)}">
<link rel="canonical" href="${attr(canonical)}">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${attr(canonical)}">
<meta property="og:image" content="${siteUrl}/${attr(data.images.ogGenerated)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#EC1C24">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;0,900;1,800;1,900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">${jsonLdData ? `\n<script type="application/ld+json">${JSON.stringify(jsonLdData)}</script>` : ''}`;
}

function siteHeader() {
  return `<a class="skip-link" href="#main">Skip to main content</a>
<header class="topbar">
  <a class="brand" href="/" aria-label="${attr(data.site.name)} home">
    <img src="/assets/${attr(data.images.logo)}" alt="${attr(data.site.name)} logo">
    <span>${esc(data.site.name)}</span>
  </a>
  <nav class="nav" aria-label="Main navigation">
    <a href="/#new-here">New Here</a>
    <a href="/#schedule">Schedule</a>
    <a href="/#routes">Routes</a>
    <a href="/#afters">AFTERS</a>
  </nav>
  <div class="top-tag">Est. ${esc(data.site.founded)} · Auckland</div>
</header>`;
}

function siteFooter() {
  return `<footer>
  <h2>See you<br><span class="red">Monday.</span></h2>
  <img class="footer-tinny" src="/assets/${attr(data.images.tinny)}" alt="Tinny running with a beer">
  <div class="footer-grid">
    <div>
      <h5>- The Club</h5>
      <p>${esc(data.site.name)}. ${esc(data.club.price)}</p>
      <p class="muted">${esc(data.location.name)}<br>${esc(data.location.street)}, ${esc(data.location.suburb)} / Uptown<br>${esc(data.location.city)}</p>
    </div>
    <div>
      <h5>- Hours</h5>
      <p>Mondays<br>${esc(data.schedule.bagDrop)} bag drop<br>${esc(data.schedule.runStart)} run</p>
      <p class="muted">${esc(data.schedule.publicHolidayRule)}<br>${esc(data.schedule.christmasRule)}</p>
    </div>
    <div>
      <h5>- Find Us</h5>
      <a href="${attr(data.links.instagram)}" target="_blank" rel="noopener">Instagram</a>
      <a href="${attr(data.links.strava)}" target="_blank" rel="noopener">Strava Club</a>
      <a href="${attr(data.links.beerJerk)}" target="_blank" rel="noopener">Beer Jerk</a>
      <a href="${attr(data.links.smallGods)}" target="_blank" rel="noopener">Small Gods</a>
    </div>
    <div>
      <h5>- Also</h5>
      <p>${esc(data.club.halfMarathonMention)}</p>
      <p class="muted">${esc(data.site.slogan)}</p>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© ${esc(data.site.shortName)} ${esc(data.site.founded)}-${String(now.getFullYear()).slice(-2)} · Made in Auckland</span>
    <span>${esc(data.site.slogan)}</span>
  </div>
</footer>`;
}

function pageLinks(currentSlug = '') {
  const pages = [
    { slug: 'new-runners', label: 'New Runners', eyebrow: 'Start' },
    { slug: 'schedule', label: 'Schedule', eyebrow: 'Next Run' },
    { slug: 'routes', label: 'Routes', eyebrow: 'Maps' },
    { slug: 'afters', label: 'AFTERS', eyebrow: 'Long Run' }
  ].filter(page => page.slug !== currentSlug);

  return `<section class="links page-links" aria-label="Related pages">
    ${pages.map(page => `<a class="link-cell" href="/${attr(page.slug)}">
      <span class="link-label">- ${esc(page.eyebrow)}</span>
      <span class="link-name">${esc(page.label)} <span class="arrow">→</span></span>
    </a>`).join('\n    ')}
  </section>`;
}

function simplePage({ slug, title, description, eyebrow, heading, intro, body }) {
  const canonical = `${siteUrl}/${slug}`;
  return `<!DOCTYPE html>
<html lang="${attr(data.site.language)}">
<head>
${pageHead({ title, description, canonical, jsonLdData: pageJsonLd({ slug, title, description }) })}
</head>
<body>
${siteHeader()}
<main id="main">
  <section class="section">
    <div class="section-head plain">
      <h1 class="section-title">${heading}</h1>
    </div>
    <p class="content-copy">${esc(intro)}</p>
  </section>
  ${body}
  ${pageLinks(slug)}
</main>
${siteFooter()}
</body>
</html>`;
}

function renderNewRunnersPage() {
  return simplePage({
    slug: 'new-runners',
    title: 'Beginner Friendly Run Club Auckland | Beer Jerk Run Club',
    description: 'Beginner-friendly guide for Beer Jerk Run Club, a free social running club in Auckland with a 5km Monday run from Small Gods Taproom.',
    eyebrow: '01',
    heading: 'Beginner Friendly Run Club Auckland',
    intro: `${data.club.opening} ${data.club.pace} ${data.club.bagDropNote} ${data.club.newRunnerNote} ${data.club.beerDeal}`,
    body: `<section class="strip" aria-label="First timer facts">
      <article class="strip-item"><div class="eyebrow muted">Cost</div><h2>Free.<br>Just Turn Up.</h2><p>${esc(data.club.price)} You do not need to message first.</p></article>
      <article class="strip-item"><div class="eyebrow muted">When</div><h2>Mondays<br>${esc(data.schedule.runStart)}</h2><p>Bag drop from ${esc(data.schedule.bagDrop)}. We run at ${esc(data.schedule.runStartLong)}.</p></article>
      <article class="strip-item"><div class="eyebrow muted">Where</div><h2>Small Gods<br>Taproom</h2><p>${esc(data.location.street)}, ${esc(data.location.suburb)} / Uptown. ${esc(data.club.parkingNote)}</p></article>
      <article class="strip-item beer-card"><div class="eyebrow">After</div><h2>Beer.<br>Or Not.</h2><p>${esc(data.club.beerDeal)} Soft drinks, cider, wine and AF beers are there too.</p></article>
    </section>
    <section class="section" id="faq">
      <div class="section-head plain"><h2 class="section-title">First Timer FAQ</h2></div>
      <div class="faq-list">${faqItems()}</div>
    </section>`
  });
}

function renderSchedulePage() {
  return simplePage({
    slug: 'schedule',
    title: 'Auckland Run Club Schedule | Beer Jerk Run Club',
    description: 'Upcoming Beer Jerk Run Club dates, Monday 5km routes, public holiday shifts and monthly AFTERS long runs in Auckland.',
    eyebrow: '02',
    heading: 'Auckland Run Club Schedule',
    intro: `Beer Jerk Run Club meets Mondays at ${data.location.name}. Bag drop is from ${data.schedule.bagDrop}, the run starts at ${data.schedule.runStartLong}. When Monday is a public holiday, we shift to Tuesday.`,
    body: `<section class="section schedule">
      <div class="schedule-list">${scheduleRows()}</div>
      <p class="note">${esc(data.schedule.publicHolidayRule)} ${esc(data.schedule.christmasRule)}</p>
    </section>`
  });
}

function renderRoutesPage() {
  return simplePage({
    slug: 'routes',
    title: '5km Run Club Routes Auckland | Beer Jerk Run Club',
    description: 'Beer Jerk Run Club route guide for 5km social runs from Small Gods Taproom in Eden Terrace, Uptown, Auckland.',
    eyebrow: '03',
    heading: '5km Run Club Routes Auckland',
    intro: `The usual Monday routes are 5km from Small Gods Taproom in Eden Terrace / Uptown.`,
    body: `<section class="section"><div class="routes-grid">${routeCards()}</div></section>`
  });
}

function renderAftersPage() {
  return simplePage({
    slug: 'afters',
    title: 'Auckland Saturday Long Run | Beer Jerk Run Club AFTERS',
    description: 'AFTERS is Beer Jerk Run Club monthly Saturday long run from Small Gods in Auckland: 8km or 13km, first Saturday of the month.',
    eyebrow: '04',
    heading: 'AFTERS',
    intro: `${data.afters.name} is our monthly long run on the first Saturday. ${data.afters.summary} Meet from ${data.afters.meet}, run at ${data.afters.start}, drinks after.`,
    body: `<section class="section">
      <div class="afters-card">
        <div class="route-info">
          <span class="route-num">- Monthly Long Run</span>
          <h2 class="route-name"><span class="red">${esc(data.afters.name)}</span></h2>
          <p class="route-desc">${esc(data.afters.summary)} ${esc(data.club.beerDeal)}</p>
        </div>
        <div class="afters-graphic">
          <div class="day">${esc(data.afters.name)}</div>
          <div class="of">Saturday long run</div>
          <div class="distance">${esc(data.afters.distance)} or ${esc(data.afters.total)}</div>
        </div>
      </div>
    </section>`
  });
}

function render404() {
  return `<!DOCTYPE html>
<html lang="${attr(data.site.language)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page Not Found | ${esc(data.site.name)}</title>
<meta name="robots" content="noindex">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>
  :root { --red:#EC1C24; --ink:#111; --paper:#F5F2EA; --grey:#636363; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body {
    min-height:100vh;
    background:var(--paper);
    color:var(--ink);
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display:grid;
    place-items:center;
    padding:28px;
  }
  main { width:min(920px, 100%); }
  img { width:120px; height:120px; object-fit:contain; margin-bottom:30px; }
  h1 {
    font-family: Impact, 'Arial Black', sans-serif;
    font-size:clamp(72px, 14vw, 160px);
    line-height:0.85;
    font-style:italic;
    text-transform:uppercase;
    margin-bottom:24px;
  }
  h1 span { color:var(--red); }
  p { font-size:clamp(18px, 2vw, 24px); max-width:680px; margin-bottom:28px; }
  nav { display:flex; flex-wrap:wrap; gap:12px; }
  a {
    background:var(--ink);
    color:var(--paper);
    padding:14px 18px;
    text-decoration:none;
    text-transform:uppercase;
    font-weight:800;
    letter-spacing:0.04em;
  }
  a:first-child { background:var(--red); }
</style>
</head>
<body>
<main>
  <img src="/assets/${attr(data.images.logo)}" alt="${attr(data.site.name)} logo">
  <h1>Wrong<br><span>Turn.</span></h1>
  <p>This page is not here. The run still starts Mondays at ${esc(data.schedule.runStart)} from ${esc(data.location.name)}.</p>
  <nav aria-label="Useful links">
    <a href="/">Back to the site</a>
    <a href="/#schedule">Schedule</a>
    <a href="${attr(data.links.instagram)}">Instagram</a>
    <a href="${attr(data.links.strava)}">Strava</a>
  </nav>
</main>
</body>
</html>`;
}

function writeText(file, text) {
  fs.writeFileSync(path.join(dist, file), text.trimStart());
}

writeText('index.html', renderHtml());
writeText('styles.css', styles());
writeText('404.html', render404());
writeText('new-runners.html', renderNewRunnersPage());
writeText('schedule.html', renderSchedulePage());
writeText('routes.html', renderRoutesPage());
writeText('afters.html', renderAftersPage());
writeText('site.webmanifest', JSON.stringify({
  name: data.site.name,
  short_name: data.site.shortName,
  description: data.site.description,
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#F5F2EA',
  theme_color: '#EC1C24',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
  ]
}, null, 2));
writeText('facts.json', JSON.stringify({
  name: data.site.name,
  url: siteUrl,
  description: data.site.description,
  location: data.location,
  schedule: {
    regularDay: data.schedule.regularDay,
    bagDrop: data.schedule.bagDrop,
    runStart: data.schedule.runStart,
    publicHolidayRule: data.schedule.publicHolidayRule,
    christmasRule: data.schedule.christmasRule,
    nextRun: nextEvent ? {
      date: isoDate(nextEvent.date),
      route: nextEvent.route,
      distance: nextEvent.km,
      note: nextEvent.note
    } : null
  },
  cost: data.club.price,
  pace: data.club.pace,
  beerDeal: data.club.beerDeal,
  searchTerms: [
    'Auckland run club',
    'Auckland running club',
    'social running club Auckland',
    'social run club Auckland',
    'beginner friendly run club Auckland',
    'all levels running club Auckland',
    'Monday run club Auckland',
    '5km run club Auckland',
    'running group Auckland',
    'Eden Terrace run club',
    'Uptown Auckland run club'
  ],
  links: data.links,
  pages: [
    { title: 'New Runners', url: `${siteUrl}/new-runners` },
    { title: 'Schedule', url: `${siteUrl}/schedule` },
    { title: 'Routes', url: `${siteUrl}/routes` },
    { title: 'AFTERS', url: `${siteUrl}/afters` }
  ],
  routes: data.routes.map(route => ({
    name: route.name,
    status: route.status,
    distance: route.distance,
    description: route.description
  })),
  afters: data.afters,
  faq: data.faq
}, null, 2));
writeText('robots.txt', `
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`);
writeText('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${isoDate(now)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/new-runners</loc>
    <lastmod>${isoDate(now)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteUrl}/schedule</loc>
    <lastmod>${isoDate(now)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${siteUrl}/routes</loc>
    <lastmod>${isoDate(now)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteUrl}/afters</loc>
    <lastmod>${isoDate(now)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
`);
writeText('llms.txt', `
# ${data.site.name}

${data.club.opening}

## Key Facts

- Location: ${data.location.name}, ${data.location.street}, ${data.location.suburb}, ${data.location.city}
- Monday run: bag drop from ${data.schedule.bagDrop}, run starts ${data.schedule.runStartLong}
- Cost: ${data.club.price}
- Pace: ${data.club.pace}
- Runner offer: ${data.club.beerDeal}
- Winter routes: ${activeRoutes.map(route => route.scheduleName || route.name).join(', ')}
- Public holidays: ${data.schedule.publicHolidayRule}
- AFTERS: ${data.afters.summary} First Saturday of the month, meet ${data.afters.meet}, run ${data.afters.start}

## Important URLs

- Website: ${siteUrl}/
- New runners: ${siteUrl}/new-runners
- Schedule: ${siteUrl}/schedule
- Routes: ${siteUrl}/routes
- AFTERS: ${siteUrl}/afters
- Machine-readable facts: ${siteUrl}/facts.json
- Instagram: ${data.links.instagram}
- Strava: ${data.links.strava}
- Beer Jerk: ${data.links.beerJerk}
- Small Gods: ${data.links.smallGods}

## Search Intent

This site is for people searching for an Auckland run club, Auckland running club, social running club Auckland, social run club Auckland, beginner friendly run club Auckland, all levels running club Auckland, Monday run club Auckland, 5km run club Auckland, free run club Auckland, running group Auckland, Eden Terrace run club, Uptown Auckland run club, or Beer Jerk Run Club.
`);
writeText('_headers', `
/robots.txt
  Content-Type: text/plain

/llms.txt
  Content-Type: text/plain

/sitemap.xml
  Content-Type: application/xml

/facts.json
  Content-Type: application/json

/site.webmanifest
  Content-Type: application/manifest+json
`);
writeText('_redirects', `
https://www.beerjerkrunclub.co.nz/* https://beerjerkrunclub.co.nz/:splat 301
`);

console.log(`Built ${path.relative(workspace, dist)}`);
