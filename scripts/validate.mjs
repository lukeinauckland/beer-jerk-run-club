import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

function read(file) {
  return fs.readFileSync(path.join(dist, file), 'utf8');
}

function check(label, ok) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed = true;
}

let failed = false;

const html = read('index.html');
const styles = read('styles.css');
const pageFiles = ['index.html', 'auckland-run-club.html', 'new-runners.html', 'schedule.html', 'routes.html', 'afters.html', '404.html'];
const allHtml = pageFiles.map(file => read(file)).join('\n');
const focusedPages = ['auckland-run-club.html', 'new-runners.html', 'schedule.html', 'routes.html', 'afters.html'];
const pageSources = Object.fromEntries(pageFiles.map(file => [file, read(file)]));
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');
const llms = read('llms.txt');
const facts = JSON.parse(read('facts.json'));
const manifest = JSON.parse(read('site.webmanifest'));
const jsonLd = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1] || '{}');
const focusedJsonLd = focusedPages.map(file => {
  const source = read(file);
  return JSON.parse(source.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1] || '{}');
});
const assetRefs = [...allHtml.matchAll(/(?:src|href|data-src)="\/?(assets\/[^"]+)"/g)].map(match => match[1]);
const dataSrcsetRefs = [...allHtml.matchAll(/data-srcset="([^"]+)"/g)]
  .flatMap(match => match[1].split(',').map(item => item.trim().split(' ')[0]))
  .filter(ref => ref.startsWith('assets/'));
const srcsetRefs = [...allHtml.matchAll(/srcset="([^"]+)"/g)]
  .flatMap(match => match[1].split(',').map(item => item.trim().split(' ')[0]))
  .filter(ref => ref.startsWith('assets/'));
const missingAssets = [...assetRefs, ...dataSrcsetRefs, ...srcsetRefs].filter(ref => !fs.existsSync(path.join(dist, ref)));

check('index.html exists', fs.existsSync(path.join(dist, 'index.html')));
check('404.html exists', fs.existsSync(path.join(dist, '404.html')));
check('auckland-run-club.html exists', fs.existsSync(path.join(dist, 'auckland-run-club.html')));
check('new-runners.html exists', fs.existsSync(path.join(dist, 'new-runners.html')));
check('schedule.html exists', fs.existsSync(path.join(dist, 'schedule.html')));
check('routes.html exists', fs.existsSync(path.join(dist, 'routes.html')));
check('afters.html exists', fs.existsSync(path.join(dist, 'afters.html')));
check('styles.css exists', fs.existsSync(path.join(dist, 'styles.css')));
check('robots.txt exists', fs.existsSync(path.join(dist, 'robots.txt')));
check('sitemap.xml exists', fs.existsSync(path.join(dist, 'sitemap.xml')));
check('llms.txt exists', fs.existsSync(path.join(dist, 'llms.txt')));
check('facts.json exists', fs.existsSync(path.join(dist, 'facts.json')));
check('site.webmanifest exists', fs.existsSync(path.join(dist, 'site.webmanifest')));
check('favicon exists', fs.existsSync(path.join(dist, 'favicon-32.png')));
check('apple touch icon exists', fs.existsSync(path.join(dist, 'apple-touch-icon.png')));
check('OG image exists', fs.existsSync(path.join(dist, 'og-image.png')) || fs.existsSync(path.join(dist, 'og-image.svg')));
check('JSON-LD has graph', Array.isArray(jsonLd['@graph']) && jsonLd['@graph'].length >= 5);
check('focused pages have JSON-LD', focusedJsonLd.every(item => Array.isArray(item['@graph']) && item['@graph'].some(node => node['@type'] === 'WebPage') && item['@graph'].some(node => node['@type'] === 'BreadcrumbList')));
check('one H1 per public page', ['index.html', ...focusedPages].every(file => (pageSources[file].match(/<h1[\s>]/g) || []).length === 1));
check('page titles are unique', new Set(['index.html', ...focusedPages].map(file => pageSources[file].match(/<title>(.*?)<\/title>/s)?.[1])).size === 6);
check('focused pages have canonicals', [
  ['auckland-run-club.html', '/auckland-run-club'],
  ['new-runners.html', '/new-runners'],
  ['schedule.html', '/schedule'],
  ['routes.html', '/routes'],
  ['afters.html', '/afters']
].every(([file, slug]) => pageSources[file].includes(`<link rel="canonical" href="https://beerjerkrunclub.co.nz${slug}">`)));
check('H1 is static HTML', /<h1>Beer Jerk Run Club <span class="red">Auckland\.<\/span><\/h1>/.test(html));
check('opening paragraph is static HTML', html.includes('free weekly social run in Auckland'));
check('schedule is static HTML', /<div class="schedule-list">[\s\S]*schedule-date/.test(html));
check('FAQ is static HTML', html.includes('Is Beer Jerk Run Club free?'));
check('$10 beer copy present', html.includes('$10 beers for runners after every run.'));
check('Strava link present', html.includes('https://www.strava.com/clubs/beerjerk'));
check('Small Gods map link present', html.includes('https://www.google.com/maps/search/'));
check('canonical correct', html.includes('<link rel="canonical" href="https://beerjerkrunclub.co.nz/">'));
check('robots allows GPTBot', robots.includes('User-agent: GPTBot') && robots.includes('Allow: /'));
check('robots allows ClaudeBot', robots.includes('User-agent: ClaudeBot'));
check('robots allows PerplexityBot', robots.includes('User-agent: PerplexityBot'));
check('sitemap points to canonical', sitemap.includes('<loc>https://beerjerkrunclub.co.nz/</loc>'));
check('sitemap includes focused pages', ['auckland-run-club', 'new-runners', 'schedule', 'routes', 'afters'].every(slug => sitemap.includes(`https://beerjerkrunclub.co.nz/${slug}`)));
check('llms has search intent', llms.includes('Auckland running club') && llms.includes('beginner friendly run club Auckland') && llms.includes('social run club Auckland'));
check('facts has search terms', Array.isArray(facts.searchTerms) && facts.searchTerms.includes('Auckland running club') && facts.searchTerms.includes('beginner friendly run club Auckland'));
check('llms links focused pages', ['auckland-run-club', 'new-runners', 'schedule', 'routes', 'afters'].every(slug => llms.includes(`https://beerjerkrunclub.co.nz/${slug}`)));
check('facts has correct domain', facts.url === 'https://beerjerkrunclub.co.nz');
check('facts lists focused pages', Array.isArray(facts.pages) && facts.pages.length === 5);
check('homepage title targets social running club', html.includes('<title>Beer Jerk Run Club Auckland | Free Social Running Club</title>'));
check('Auckland run club page targets generic query', pageSources['auckland-run-club.html'].includes('<title>Auckland Run Club | Free Monday 5km Social Run</title>') && pageSources['auckland-run-club.html'].includes('Looking for an Auckland run club?'));
check('new runners page targets beginners', pageSources['new-runners.html'].includes('<title>Beginner Friendly Run Club Auckland | Beer Jerk Run Club</title>'));
check('homepage links Auckland run club page', html.includes('href="/auckland-run-club"'));
check('homepage nav uses in-page anchors', ['#new-here', '#schedule', '#routes', '#afters'].every(anchor => html.includes(`href="${anchor}"`)));
check('homepage removed old quick actions', !html.includes('class="quick-actions"') && !html.includes('First Time?'));
check('schedule appears before wall on homepage', html.indexOf('id="schedule"') > -1 && html.indexOf('id="wall"') > -1 && html.indexOf('id="schedule"') < html.indexOf('id="wall"'));
check('internal page links have generated files', [...allHtml.matchAll(/href="\/(auckland-run-club|new-runners|schedule|routes|afters)"/g)].every(match => fs.existsSync(path.join(dist, `${match[1]}.html`))));
check('manifest has icons', Array.isArray(manifest.icons) && manifest.icons.length >= 2);
check('HTML uses responsive images', html.includes('srcset='));
check('HTML has image dimensions', /<img[^>]+ width="\d+" height="\d+"/.test(html));
check('non-primary hero slides are deferred', html.includes('data-src=') && html.includes('data-srcset='));
check('CSS uses content visibility', styles.includes('content-visibility: auto'));
check('HTML links manifest', html.includes('<link rel="manifest" href="/site.webmanifest">'));
check('HTML links stylesheet', html.includes('<link rel="stylesheet" href="/styles.css">'));
check('HTML links favicon', html.includes('<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">'));
check('HTML references OG image', html.includes('<meta property="og:image" content="https://beerjerkrunclub.co.nz/og-image.png">'));
check('no missing assets', missingAssets.length === 0);
check('no Meetup in live HTML', !/meetup/i.test(html));
check('no Half ticket link', !/beer-jerk-run-club-half-marathon-ticket/i.test(html));
check('no newsletter form', !/<form/i.test(html));
check('no full public Streak Board module', !html.includes('class="streak-board"'));
check('no old 16km copy', !/16\s?km|16 KM/i.test(html));
check('no em dashes in public HTML', !/—/.test(allHtml));
check('no fake stats or lore in public HTML', !/cancelled twice|founded in a garage|members strong|since day one/i.test(allHtml));
check('no placeholder hrefs in public HTML', !/href=["']#["']/.test(allHtml));
check('no empty image alt text', !/<img\b[^>]*\salt=["']["']/i.test(allHtml));

for (const file of pageFiles) {
  const page = pageSources[file];
  const ids = new Set([...page.matchAll(/\sid=["']([^"']+)["']/g)].map(match => match[1]));
  const fragments = [...page.matchAll(/href=["']#([^"']+)["']/g)].map(match => match[1]);
  check(`${file} fragment links resolve`, fragments.every(fragment => ids.has(fragment)));
}

if (missingAssets.length) {
  console.log('Missing assets:', missingAssets.join(', '));
}

if (failed) process.exit(1);
