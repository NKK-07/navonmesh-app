/* NAVONMESH API.
 *
 * Serves the site and the app, and carries alerts from the LoRa gateway to
 * farmers' phones. Every request that touches data runs inside a transaction
 * stamped with the caller's identity, so row level security decides what is
 * visible rather than this file remembering to filter.
 *
 * Three kinds of caller:
 *   anonymous  login only
 *   user       Bearer JWT, phone plus PIN
 *   device     Bearer gateway key, scoped to exactly one unit
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { withUser, withDevice, health } from './db.js';
import { login, readToken, deviceUnitFor } from './auth.js';
import { fanOut, vapid } from './push.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const PORT = Number(process.env.PORT || 4000);

/* ------------------------------------------------------------------ util */

const json = (res, code, obj) =>
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  }).end(JSON.stringify(obj));

function body(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => {
      raw += c;
      if (raw.length > limit) { reject(new Error('body too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error('bad json')); }
    });
    req.on('error', reject);
  });
}

/* A small in-memory limiter. Enough to blunt PIN guessing from one address;
 * the real defence is the per-account lockout in auth.js, which survives a
 * restart and cannot be dodged by changing IP. */
const hits = new Map();
function rateLimited(key, max, windowMs) {
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || now > rec.reset) { hits.set(key, { n: 1, reset: now + windowMs }); return false; }
  rec.n++;
  return rec.n > max;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
}, 60_000).unref();

const clientIp = req =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
  req.socket.remoteAddress || 'unknown';

/* ---------------------------------------------------------------- static */

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webmanifest': 'application/manifest+json'
};

function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel.endsWith('/')) rel += 'index.html';

  const full = path.normalize(path.join(ROOT, rel));
  /* Never outside the repo, and never the server directory: that is where the
     VAPID keys and node_modules live. */
  if (!full.startsWith(ROOT) || full.startsWith(HERE)) {
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

/* ------------------------------------------------------------------- api */

async function api(req, res, route) {
  const method = req.method;

  /* -------------------------------------------------------- public */

  if (route === '/api/health' && method === 'GET') {
    try {
      const at = await health();
      return json(res, 200, { ok: true, db: 'up', at });
    } catch (err) {
      return json(res, 503, { ok: false, db: 'down', error: err.message });
    }
  }

  if (route === '/api/vapid-public-key' && method === 'GET') {
    return json(res, 200, { publicKey: vapid.publicKey });
  }

  if (route === '/api/auth/login' && method === 'POST') {
    if (rateLimited('login:' + clientIp(req), 10, 60_000)) {
      return json(res, 429, { error: 'too many attempts, wait a minute' });
    }
    const { phone, pin } = await body(req);
    if (!phone || !pin) return json(res, 400, { error: 'phone and pin required' });

    const result = await login(String(phone).trim(), String(pin));
    if (!result.ok) {
      if (result.reason === 'locked') {
        return json(res, 423, { error: 'locked', until: result.until });
      }
      return json(res, 401, { error: 'wrong phone or PIN' });
    }
    return json(res, 200, { token: result.token, user: result.user });
  }

  /* ---------------------------------------------------- device routes */

  if (route.startsWith('/api/device/')) {
    const unitId = await deviceUnitFor(req);
    if (!unitId) return json(res, 401, { error: 'unknown or revoked device key' });

    if (route === '/api/device/alert' && method === 'POST') {
      const b = await body(req);
      const level = b.level === 'info' ? 'info' : 'action';
      const kind = String(b.kind || 'general').slice(0, 64);

      const alert = await withDevice(unitId, async c => {
        /* One open alert per kind per unit: a gateway that retries does not
           stack duplicates on the farmer's phone. */
        const { rows } = await c.query(`
          insert into alerts (unit_id, level, kind, title, body, action)
          values ($1, $2, $3, $4, $5, $6)
          on conflict (unit_id, kind) where cleared_at is null
          do update set title = excluded.title, body = excluded.body,
                        action = excluded.action, level = excluded.level
          returning *`,
          [unitId, level, kind,
           String(b.title || 'NAVONMESH').slice(0, 200),
           String(b.body || '').slice(0, 500),
           String(b.action || '').slice(0, 300)]);
        return rows[0];
      });

      const tally = await fanOut(alert);
      return json(res, 201, { ok: true, alert, delivery: tally });
    }

    if (route === '/api/device/clear' && method === 'POST') {
      const b = await body(req);
      const cleared = await withDevice(unitId, async c => {
        const { rows } = await c.query(
          `update alerts set cleared_at = now()
            where unit_id = $1 and kind = $2 and cleared_at is null
            returning id`, [unitId, String(b.kind || '')]);
        return rows.length;
      });
      return json(res, 200, { ok: true, cleared });
    }

    if (route === '/api/device/reading' && method === 'POST') {
      const b = await body(req);
      await withDevice(unitId, c => c.query(`
        insert into readings
          (unit_id, temp_c, humidity_pct, battery_pct, solar_kw, load_kg, door_open, pcm_pct)
        values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [unitId, b.temp_c, b.humidity_pct, b.battery_pct,
         b.solar_kw, b.load_kg, b.door_open, b.pcm_pct]));
      return json(res, 201, { ok: true });
    }

    return json(res, 404, { error: 'no such device endpoint' });
  }

  /* ------------------------------------------------------ user routes */

  const claims = readToken(req);
  if (!claims) return json(res, 401, { error: 'sign in first' });
  const uid = claims.sub;

  if (route === '/api/me' && method === 'GET') {
    const me = await withUser(uid, async c => {
      const { rows } = await c.query(
        `select id, phone, name, role, lang, fpo_id from users where id = $1`, [uid]);
      return rows[0] || null;
    });
    return json(res, me ? 200 : 404, me || { error: 'not found' });
  }

  if (route === '/api/units' && method === 'GET') {
    const units = await withUser(uid, async c => {
      const { rows } = await c.query(
        `select id, code, label, district, capacity_kg from units order by code`);
      return rows;
    });
    return json(res, 200, { units });
  }

  if (route === '/api/alerts' && method === 'GET') {
    const alerts = await withUser(uid, async c => {
      const { rows } = await c.query(`
        select a.id, a.unit_id, u.code as unit_code, a.level, a.kind,
               a.title, a.body, a.action, a.raised_at, a.cleared_at
          from alerts a join units u on u.id = a.unit_id
         order by a.raised_at desc limit 100`);
      return rows;
    });
    return json(res, 200, { alerts });
  }

  if (route.startsWith('/api/alerts/') && route.endsWith('/ack') && method === 'POST') {
    const id = route.split('/')[3];
    const n = await withUser(uid, async c => {
      const { rows } = await c.query(
        `update alerts set cleared_at = now()
          where id = $1 and cleared_at is null returning id`, [id]);
      return rows.length;
    });
    return json(res, 200, { ok: true, cleared: n });
  }

  if (route === '/api/batches' && method === 'GET') {
    const batches = await withUser(uid, async c => {
      const { rows } = await c.query(`
        select b.id, b.unit_id, b.crop_id, b.weight_kg, b.stored_on,
               b.owner_id, u.name as owner_name
          from batches b left join users u on u.id = b.owner_id
         where b.removed_on is null
         order by b.stored_on`);
      return rows;
    });
    return json(res, 200, { batches });
  }

  if (route === '/api/push/subscribe' && method === 'POST') {
    const b = await body(req);
    const s = b.subscription;
    if (!s || !s.endpoint || !s.keys) return json(res, 400, { error: 'bad subscription' });

    const levels = Array.isArray(b.levels) && b.levels.length ? b.levels : ['action'];
    await withUser(uid, c => c.query(`
      insert into push_subscriptions
        (user_id, endpoint, p256dh, auth, levels, quiet_from, quiet_to, user_agent)
      values ($1,$2,$3,$4,$5,$6,$7,$8)
      on conflict (endpoint) do update
        set user_id = excluded.user_id, p256dh = excluded.p256dh,
            auth = excluded.auth, levels = excluded.levels,
            quiet_from = excluded.quiet_from, quiet_to = excluded.quiet_to,
            failures = 0`,
      [uid, s.endpoint, s.keys.p256dh, s.keys.auth, levels,
       Number.isInteger(b.quietFrom) ? b.quietFrom : 21,
       Number.isInteger(b.quietTo) ? b.quietTo : 5,
       String(req.headers['user-agent'] || '').slice(0, 300)]));
    return json(res, 201, { ok: true });
  }

  if (route === '/api/push/unsubscribe' && method === 'POST') {
    const b = await body(req);
    await withUser(uid, c => c.query(
      'delete from push_subscriptions where endpoint = $1', [b.endpoint || '']));
    return json(res, 200, { ok: true });
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
    console.error('[api]', route, err.message);
    json(res, 500, { error: 'server error' });
  }
}).listen(PORT, () => {
  console.log('NAVONMESH API on http://localhost:' + PORT);
  console.log('  app   http://localhost:' + PORT + '/app/');
  console.log('  site  http://localhost:' + PORT + '/');
});
