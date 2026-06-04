import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const port = Number(process.env.PORT || 4173);

const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8']
]);

function fileForUrl(url) {
  const pathname = decodeURIComponent(new URL(url, `http://localhost:${port}`).pathname);
  const clean = pathname === '/' ? '/index' : pathname.replace(/\/$/, '');
  const candidates = [
    path.join(dist, clean),
    path.join(dist, `${clean}.html`),
    path.join(dist, clean, 'index.html')
  ];
  return candidates.find(file => fs.existsSync(file) && fs.statSync(file).isFile()) || path.join(dist, '404.html');
}

const server = http.createServer((req, res) => {
  const file = fileForUrl(req.url || '/');
  const ext = path.extname(file);
  res.setHeader('Content-Type', types.get(ext) || 'application/octet-stream');
  res.statusCode = path.basename(file) === '404.html' && !(req.url || '').includes('404') ? 404 : 200;
  fs.createReadStream(file).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Preview running at http://localhost:${port}/`);
});

