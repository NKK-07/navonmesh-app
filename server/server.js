/* NAVONMESH push relay.
 *
 * Two jobs, deliberately small.
 *
 * 1. Serve the site and the app, so the page and this API share an origin and
 *    there is no CORS to configure for a demo.
 * 2. Hold Web Push subscriptions and fan an alert out to them, so a farmer's
 *    phone rings when the app is closed. In the real deployment the caller is
 *    the LoRa gateway: the unit reports over 868 MHz, the gateway POSTs to
 *    /api/alert, and every subscribed phone gets it. SMS stays the fallback
 *    for handsets with no data.
 *
 * There is no database on purpose. Subscriptions are a JSON file. That is the
 * right amount of machinery for one collection point, and it makes the whole
 * thing readable in one sitting.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import webpush from 'web-push';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const PORT = Number(process.env.PORT || 4000);

const VAPID_FILE = path.join(HERE, 'vapid.json');
const SUBS_FILE = path.join(HERE, 'subscriptions.json');

/* ---------------------------------------------------------------- keys */
/* Generated once on first boot and kept on disk. Regenerating them would
   invalidate every subscription already handed out, so the file is the
   source of truth and it is gitignored. */
function loadVapid() {
  if (fs.existsSync(VAPID_FILE)) {
    return JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8'));
  }
  const keys = webpush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_FILE, JSON.stringify(keys, null, 2));
  console.log('Generated a new VAPID key pair at server/vapid.json');
  return keys;
}

const vapid = loadVapid();
webpush.setVapidDetails(
  process.env.VAPID_CONTACT || 'mailto:team@navonmesh.example',
  vapid.publicKey,
  vapid.privateKey
);

/* --------------------------------------------------------- subscriptions */
function loadSubs() {
  try {
    return JSON.parse(fs.readFileSync(SUBS_FILE, 'utf8'));
  } catch {
    return [];
  }
}
function saveSubs(subs) {
  fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2));
}

/* ---------------------------------------------------------------- static */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webmanifest': 'application/manifest+json'
};

function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel.endsWith('/')) rel += 'index.html';

  const full = path.join(ROOT, rel);
  /* never serve outside the repo, and never serve the server's own secrets */
  if (!full.startsWith(ROOT) || full.startsWith(HERE)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  fs.readFile(full, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
      return;
    }
    const type = MIME[path.extname(full).toLowerCase()] || 'application/octet-stream';
    /* a service worker must never be served stale or its updates never land */
    const cache = full.endsWith('sw.js') ? 'no-cache' : 'no-store';
    res.writeHead(200, { 'content-type': type, 'cache-control': cache }).end(buf);
  });
}

/* ------------------------------------------------------------------ api */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => {
      raw += c;
      if (raw.length > 1e6) reject(new Error('body too large'));
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error('bad json')); }
    });
    req.on('error', reject);
  });
}

const json = (res, code, obj) =>
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' })
     .end(JSON.stringify(obj));

async function api(req, res, route) {
  if (route === '/api/health' && req.method === 'GET') {
    return json(res, 200, { ok: true, subscriptions: loadSubs().length });
  }

  if (route === '/api/vapid-public-key' && req.method === 'GET') {
    return json(res, 200, { publicKey: vapid.publicKey });
  }

  if (route === '/api/subscribe' && req.method === 'POST') {
    const body = await readBody(req);
    const sub = body.subscription;
    if (!sub || !sub.endpoint) return json(res, 400, { error: 'missing subscription' });

    const subs = loadSubs();
    const i = subs.findIndex(s => s.subscription.endpoint === sub.endpoint);
    const record = {
      subscription: sub,
      unit: body.unit || 'NM-004',
      lang: body.lang || 'en',
      levels: body.levels || ['action'],
      createdAt: new Date().toISOString()
    };
    if (i >= 0) subs[i] = record; else subs.push(record);
    saveSubs(subs);
    return json(res, 201, { ok: true, subscriptions: subs.length });
  }

  if (route === '/api/unsubscribe' && req.method === 'POST') {
    const body = await readBody(req);
    const subs = loadSubs().filter(s => s.subscription.endpoint !== body.endpoint);
    saveSubs(subs);
    return json(res, 200, { ok: true, subscriptions: subs.length });
  }

  /* The endpoint the LoRa gateway calls when the unit reports something. */
  if (route === '/api/alert' && req.method === 'POST') {
    const body = await readBody(req);
    const payload = {
      id: body.id || 'ALT-' + Date.now(),
      level: body.level || 'info',          /* action | info */
      title: body.title || 'NAVONMESH',
      body: body.body || '',
      action: body.action || '',
      unit: body.unit || 'NM-004',
      at: new Date().toISOString()
    };

    const subs = loadSubs();
    const keep = [];
    let sent = 0, dropped = 0;

    await Promise.all(subs.map(async record => {
      if (!record.levels.includes(payload.level)) { keep.push(record); return; }
      try {
        await webpush.sendNotification(record.subscription, JSON.stringify(payload));
        sent++;
        keep.push(record);
      } catch (err) {
        /* 404 and 410 mean the browser threw the subscription away. Anything
           else is transient, so the record survives to try again. */
        if (err.statusCode === 404 || err.statusCode === 410) {
          dropped++;
        } else {
          keep.push(record);
          console.warn('push failed:', err.statusCode, err.body || err.message);
        }
      }
    }));

    if (dropped) saveSubs(keep);
    return json(res, 200, { ok: true, sent, dropped, payload });
  }

  return json(res, 404, { error: 'no such endpoint' });
}

/* ---------------------------------------------------------------- server */
http.createServer(async (req, res) => {
  const route = (req.url || '/').split('?')[0];
  try {
    if (route.startsWith('/api/')) return await api(req, res, route);
    return serveStatic(req, res, req.url || '/');
  } catch (err) {
    console.error(err);
    json(res, 500, { error: String(err.message || err) });
  }
}).listen(PORT, () => {
  console.log('NAVONMESH push relay on http://localhost:' + PORT);
  console.log('  app          http://localhost:' + PORT + '/app/');
  console.log('  site         http://localhost:' + PORT + '/');
  console.log('  subscribers  ' + loadSubs().length);
  console.log('');
  console.log('  Fire a test alert:');
  console.log('    curl -X POST http://localhost:' + PORT + '/api/alert \\');
  console.log('      -H "content-type: application/json" \\');
  console.log('      -d \'{"level":"action","title":"Door open 9 minutes",' +
              '"body":"Chamber at 12.4 C. Close the door to hold temperature.",' +
              '"action":"Close the door."}\'');
});
