import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const content = JSON.parse(fs.readFileSync(path.join(root, 'content', 'site.json'), 'utf8'));

function size(file) {
  return fs.statSync(path.join(dist, file)).size;
}

function kb(bytes) {
  return `${Math.round(bytes / 1024)}KB`;
}

function dirSize(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    total += entry.isDirectory() ? dirSize(p) : fs.statSync(p).size;
  }
  return total;
}

const pages = ['index.html', 'auckland-run-club.html', 'new-runners.html', 'schedule.html', 'routes.html', 'afters.html', '404.html'];
const assets = fs.readdirSync(path.join(dist, 'assets'));
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const nextRunSection = html.match(/<section class="next-run"[\s\S]*?<\/section>/)?.[0] || '';
const nextRunBig = [...nextRunSection.matchAll(/<div class="nr-big">(.*?)<\/div>/g)].map(match => match[1].replace(/<[^>]+>/g, ''));
const nextRunEyebrows = [...nextRunSection.matchAll(/<div class="eyebrow">(.*?)<\/div>/g)].map(match => match[1].replace(/<[^>]+>/g, ''));

const report = `# Build Report

Generated: ${new Date().toISOString()}

## Site

- Name: ${content.site.name}
- Domain: ${content.site.url}
- Purpose: ${content.club.oneLine}
- Beer offer: ${content.club.beerDeal}

## Current Build

- Total dist size: ${kb(dirSize(dist))}
- Asset folder size: ${kb(dirSize(path.join(dist, 'assets')))}
- Asset count: ${assets.length}
- Homepage size: ${kb(size('index.html'))}
- CSS size: ${kb(size('styles.css'))}
- OG image size: ${kb(size('og-image.png'))}

## Pages

${pages.map(page => `- /${page === 'index.html' ? '' : page.replace('.html', '')} (${kb(size(page))})`).join('\n')}

## Next Run Snapshot

${nextRunBig.length >= 2 ? `- Day/date label: ${nextRunEyebrows[1] || 'Not found'}
- Date: ${nextRunBig[0]}
- Route: ${nextRunBig[1]}` : '- Not found'}

## Generated SEO / AI Files

- /robots.txt
- /sitemap.xml
- /llms.txt
- /facts.json
- /site.webmanifest
- /og-image.png

## Launch Exclusions

- No Meetup link in live HTML
- No Half Marathon ticket link
- No newsletter form
- No public Streak Board section
- No old 16km Afters copy

## Required Preview QA

The build report does not replace visual QA. Check the Vercel preview on mobile, tablet and desktop before connecting the domain.
`;

fs.writeFileSync(path.join(root, 'BUILD_REPORT.md'), report);
console.log('Wrote BUILD_REPORT.md');
