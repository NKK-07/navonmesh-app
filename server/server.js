/* The local entry point.
 *
 * In deployment there is no server: the site and the app are static files on
 * a CDN, and /api/* is one function (api/[...path].js). Locally that split
 * would mean running two things, so this serves both from one port, using the
 * exact same route module the function uses. Anything you can reproduce here
 * is a real bug there.
 *
 *   npm run dev      then http://localhost:4000/app/
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { serveApi } from '../api/_lib/routes.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const PORT = Number(process.env.PORT || 4000);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webmanifest': 'application/manifest+json'
};

/* The deployed site is a directory of static files served from the repo root,
 * so this reads from the repo root too, and hides exactly what the platform
 * hides: the API source and this directory. */
const HIDDEN = [HERE, path.join(ROOT, 'api'), path.join(ROOT, 'node_modules')];

function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel.endsWith('/')) rel += 'index.html';

  const full = path.normalize(path.join(ROOT, rel));
  if (!full.startsWith(ROOT) || HIDDEN.some(d => full.startsWith(d))) {
    return res.writeHead(403).end('Forbidden');
  }
  fs.readFile(full, (err, buf) => {
    if (err) return res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    res.writeHead(200, {
      'content-type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream',
      /* a service worker served stale never updates */
      'cache-control': full.endsWith('sw.js') ? 'no-cache' : 'no-store',
      'x-content-type-options': 'nosniff'
    }).end(buf);
  });
}

http.createServer(async (req, res) => {
  const route = (req.url || '/').split('?')[0];
  if (route.startsWith('/api/')) return serveApi(req, res, route);
  try {
    serveStatic(req, res, req.url || '/');
  } catch (err) {
    console.error('[static]', route, err.message);
    res.writeHead(500).end('server error');
  }
}).listen(PORT, () => {
  console.log('NAVONMESH on http://localhost:' + PORT);
  console.log('  app   http://localhost:' + PORT + '/app/');
  console.log('  site  http://localhost:' + PORT + '/');
});
