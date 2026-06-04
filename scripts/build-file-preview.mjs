import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const preview = path.join(root, 'local-preview');

const htmlPages = ['index.html', 'new-runners.html', 'schedule.html', 'routes.html', 'afters.html', '404.html'];
const pageMap = new Map([
  ['/', 'index.html'],
  ['/new-runners', 'new-runners.html'],
  ['/schedule', 'schedule.html'],
  ['/routes', 'routes.html'],
  ['/afters', 'afters.html']
]);

function rewriteHtml(source) {
  let html = source
    .replaceAll('href="/styles.css"', 'href="styles.css"')
    .replaceAll('href="/favicon-32.png"', 'href="favicon-32.png"')
    .replaceAll('href="/apple-touch-icon.png"', 'href="apple-touch-icon.png"')
    .replaceAll('href="/site.webmanifest"', 'href="site.webmanifest"')
    .replaceAll('href="/sitemap.xml"', 'href="sitemap.xml"')
    .replaceAll('src="/assets/', 'src="assets/')
    .replaceAll('href="/assets/', 'href="assets/');

  html = html.replace(/href="\/(new-runners|schedule|routes|afters)"/g, 'href="$1.html"');
  html = html.replace(/href="\/#([^"]+)"/g, 'href="index.html#$1"');
  html = html.replace(/href="\/"/g, 'href="index.html"');
  html = html.replace(/href="https:\/\/beerjerkrunclub\.co\.nz\/"/g, 'href="index.html"');

  return html;
}

if (!fs.existsSync(dist)) {
  throw new Error('Build dist first with npm run build');
}

fs.rmSync(preview, { recursive: true, force: true });
fs.mkdirSync(preview, { recursive: true });

for (const entry of fs.readdirSync(dist)) {
  const source = path.join(dist, entry);
  const target = path.join(preview, entry);
  fs.cpSync(source, target, { recursive: true });
}

for (const page of htmlPages) {
  const file = path.join(preview, page);
  fs.writeFileSync(file, rewriteHtml(fs.readFileSync(file, 'utf8')));
}

const readme = `# Local Preview

Open index.html directly in a browser.

This folder is only for local review. Deploy production/dist, not this folder.
`;

fs.writeFileSync(path.join(preview, 'README.md'), readme);
console.log(`Wrote ${path.relative(root, preview)}/index.html`);

