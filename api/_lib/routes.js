/* NAVONMESH API routes.
 *
 * Carries alerts from the LoRa gateway to farmers' phones, and answers the
 * app's reads. Every request that touches data runs inside a transaction
 * stamped with the caller's identity, so row level security decides what is
 * visible rather than this file remembering to filter.
 *
 * Three kinds of caller:
 *   anonymous  login only
 *   user       Bearer JWT, phone plus PIN
 *   device     Bearer gateway key, scoped to exactly one unit
 *
 * Nothing here knows what is hosting it. It takes a Node request and response
 * and a route string, which is all a serverless function and a local http
 * server have in common. api/[...path].js is the deployed entry point;
 * server/server.js is the local one and also serves the static files.
 */

import { withUser, withDevice, health } from './db.js';
import { login, readToken, deviceUnitFor } from './auth.js';
import { fanOut, vapidPublicKey } from './push.js';

const json = (res, code, obj) =>
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  }).end(JSON.stringify(obj));

/* The serverless runtime parses a JSON body before the handler runs; a bare
 * http server hands over an unread stream. Accept either. */
function body(req, limit = 64 * 1024) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') {
    try { return Promise.resolve(req.body ? JSON.parse(req.body) : {}); }
    catch { return Promise.reject(new Error('bad json')); }
  }
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

/* A small in-memory limiter. On one long lived process it blunts PIN guessing
 * from one address. Spread across serverless instances it blunts much less,
 * which is why it was never the real defence: that is the per-account lockout
 * in auth.js, which lives in Postgres, survives a restart, is shared by every
 * instance, and cannot be dodged by changing IP. */
const hits = new Map();
function rateLimited(key, max, windowMs) {
  const now = Date.now();
  if (hits.size > 5000) hits.clear();          // no sweeper on a cold start
  const rec = hits.get(key);
  if (!rec || now > rec.reset) { hits.set(key, { n: 1, reset: now + windowMs }); return false; }
  rec.n++;
  return rec.n > max;
}

const clientIp = req =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
  (req.socket && req.socket.remoteAddress) || 'unknown';

/** Handle one /api/... request. `route` is the path with no query string. */
export async function handleApi(req, res, route) {
  const method = req.method;

  /* -------------------------------------------------------- public */

  if (route === '/api/health' && method === 'GET') {
    try {
      const at = await health();
      return json(res, 200, { ok: true, db: 'up', at, push: !!vapidPublicKey() });
    } catch (err) {
      return json(res, 503, { ok: false, db: 'down', error: err.message });
    }
  }

  if (route === '/api/vapid-public-key' && method === 'GET') {
    const key = vapidPublicKey();
    if (!key) return json(res, 503, { error: 'push is not configured' });
    return json(res, 200, { publicKey: key });
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
      /* RLS decides the rows: a farmer gets the units they are a member of, a
         manager gets every unit their FPO owns. This query does not filter,
         on purpose. Filtering here as well would hide the fact that the
         policy is what makes it correct. */
      const { rows } = await c.query(`
        select u.id, u.code, u.label, u.district, u.capacity_kg,
               u.setpoint_c, u.setpoint_set_at,
               s.name as setpoint_set_by_name,
               f.operator_phone,
               coalesce(b.stored_kg, 0) as stored_kg,
               coalesce(b.batch_count, 0) as batch_count
          from units u
          left join users s on s.id = u.setpoint_set_by
          left join fpos  f on f.id = u.fpo_id
          left join (
            select unit_id,
                   sum(weight_kg)::numeric(10,2) as stored_kg,
                   count(*)::int as batch_count
              from batches where removed_on is null
             group by unit_id
          ) b on b.unit_id = u.id
         order by u.code`);
      return rows;
    });
    return json(res, 200, { units });
  }

  /* Telemetry, read back. The gateway has been able to write readings since
     the first migration and nothing could ever read them, which made the one
     number this product exists to show — the temperature inside the chamber —
     unreachable from the app. */
  if (route === '/api/readings' && method === 'GET') {
    const q = new URL(req.url, 'http://x').searchParams;
    const unit = q.get('unit');
    const limit = Math.min(Math.max(parseInt(q.get('limit') || '60', 10) || 60, 1), 500);

    const readings = await withUser(uid, async c => {
      const { rows } = await c.query(`
        select r.unit_id, u.code as unit_code, r.taken_at, r.temp_c,
               r.humidity_pct, r.battery_pct, r.solar_kw, r.load_kg,
               r.door_open, r.pcm_pct
          from readings r join units u on u.id = r.unit_id
         where ($1::uuid is null or r.unit_id = $1)
         order by r.taken_at desc
         limit $2`, [unit || null, limit]);
      return rows;
    });
    /* Oldest first is what a chart wants; the query sorts the other way so
       the limit takes the most recent rows rather than the first ever. */
    return json(res, 200, { readings: readings.reverse() });
  }

  /* The target temperature, set once by a manager and read by every farmer on
     the unit. A trigger keeps this to the setpoint columns, so a manager
     cannot rename or resize a unit through here. */
  if (route.startsWith('/api/units/') && method === 'PATCH') {
    const id = route.split('/')[3];
    const b = await body(req);

    let setpoint = null;
    if (b.setpoint_c !== null && b.setpoint_c !== undefined) {
      setpoint = Number(b.setpoint_c);
      if (!Number.isFinite(setpoint) || setpoint < 0 || setpoint > 25) {
        return json(res, 400, { error: 'setpoint must be between 0 and 25 degrees' });
      }
    }

    try {
      const updated = await withUser(uid, async c => {
        const { rows } = await c.query(`
          update units
             set setpoint_c = $2, setpoint_set_by = $3, setpoint_set_at = now()
           where id = $1
           returning id, code, setpoint_c, setpoint_set_at`,
          [id, setpoint, uid]);
        return rows[0] || null;
      });
      /* No row means the policy refused it: not a manager, or not their FPO.
         RLS answers this, not an if statement up here. */
      if (!updated) return json(res, 403, { error: 'only an FPO manager can set this' });
      return json(res, 200, { unit: updated });
    } catch (err) {
      if (/only the setpoint/.test(err.message)) {
        return json(res, 400, { error: err.message });
      }
      throw err;
    }
  }

  /* Applies one setpoint to every unit the caller may write. For a manager
     that is their whole FPO, which is what "adjusts in all logins" means. */
  if (route === '/api/units/setpoint' && method === 'POST') {
    const b = await body(req);
    const setpoint = Number(b.setpoint_c);
    if (!Number.isFinite(setpoint) || setpoint < 0 || setpoint > 25) {
      return json(res, 400, { error: 'setpoint must be between 0 and 25 degrees' });
    }
    const units = await withUser(uid, async c => {
      const { rows } = await c.query(`
        update units
           set setpoint_c = $1, setpoint_set_by = $2, setpoint_set_at = now()
         returning id, code, setpoint_c`, [setpoint, uid]);
      return rows;
    });
    if (!units.length) return json(res, 403, { error: 'only an FPO manager can set this' });
    return json(res, 200, { updated: units.length, units });
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
        select b.id, b.unit_id, n.code as unit_code, b.crop_id, b.weight_kg,
               b.stored_on, b.owner_id, u.name as owner_name,
               b.for_sale, b.ask_price_inr, b.note,
               (b.owner_id = $1) as is_mine
          from batches b
          left join users u on u.id = b.owner_id
          join units n on n.id = b.unit_id
         where b.removed_on is null
         order by b.stored_on`, [uid]);
      return rows;
    });
    return json(res, 200, { batches });
  }

  /* Putting produce in. The insert policy requires owner_id = the caller, so
     a farmer cannot store produce in someone else's name, and requires the
     unit to be one they are a member of. Neither check is repeated here. */
  if (route === '/api/batches' && method === 'POST') {
    const b = await body(req);
    const weight = Number(b.weight_kg);
    if (!b.unit_id) return json(res, 400, { error: 'unit_id required' });
    if (!b.crop_id) return json(res, 400, { error: 'crop_id required' });
    if (!Number.isFinite(weight) || weight <= 0 || weight > 10000) {
      return json(res, 400, { error: 'weight_kg must be between 0 and 10000' });
    }

    try {
      const batch = await withUser(uid, async c => {
        const { rows } = await c.query(`
          insert into batches
            (unit_id, owner_id, crop_id, weight_kg, for_sale, ask_price_inr, note)
          values ($1, $2, $3, $4, $5, $6, $7)
          returning *`,
          [b.unit_id, uid, String(b.crop_id).slice(0, 64), weight,
           !!b.for_sale,
           b.ask_price_inr === null || b.ask_price_inr === undefined
             ? null : Number(b.ask_price_inr),
           b.note ? String(b.note).slice(0, 300) : null]);
        return rows[0];
      });
      return json(res, 201, { batch });
    } catch (err) {
      /* A policy refusal reads as a row level security violation, and it means
         the caller is not a member of that unit. That is a 403, not a 500. */
      if (/row-level security/i.test(err.message)) {
        return json(res, 403, { error: 'you are not storing produce at that unit' });
      }
      if (/batches_weight_sane|batches_price_sane/.test(err.message)) {
        return json(res, 400, { error: 'weight or price out of range' });
      }
      throw err;
    }
  }

  /* Adjusting produce: the weight, whether it is for sale, the asking price,
     and taking it out. Removal is `removed_on` rather than a delete, so the
     tonnage-saved figure keeps its history. */
  if (route.startsWith('/api/batches/') && method === 'PATCH') {
    const id = route.split('/')[3];
    const b = await body(req);

    const sets = [];
    const args = [id];
    const put = (sql, value) => { args.push(value); sets.push(sql + ' = $' + args.length); };

    if (b.weight_kg !== undefined) {
      const w = Number(b.weight_kg);
      if (!Number.isFinite(w) || w <= 0 || w > 10000) {
        return json(res, 400, { error: 'weight_kg must be between 0 and 10000' });
      }
      put('weight_kg', w);
    }
    if (b.for_sale !== undefined) put('for_sale', !!b.for_sale);
    if (b.ask_price_inr !== undefined) {
      const p = b.ask_price_inr === null ? null : Number(b.ask_price_inr);
      if (p !== null && (!Number.isFinite(p) || p < 0)) {
        return json(res, 400, { error: 'ask_price_inr cannot be negative' });
      }
      put('ask_price_inr', p);
    }
    if (b.note !== undefined) put('note', b.note ? String(b.note).slice(0, 300) : null);
    /* current_date, not a date computed in Node. The app runs in IST and the
       server may not; taking the UTC date puts an evening removal on
       yesterday, which is wrong on the one report where it matters. */
    if (b.removed === true) sets.push('removed_on = current_date');

    if (!sets.length) return json(res, 400, { error: 'nothing to change' });

    const batch = await withUser(uid, async c => {
      const { rows } = await c.query(
        `update batches set ${sets.join(', ')} where id = $1 returning *`, args);
      return rows[0] || null;
    });
    /* The update policy is owner-or-manager. No row back means neither. */
    if (!batch) return json(res, 403, { error: 'that is not your produce' });
    return json(res, 200, { batch });
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

/** Wraps handleApi so no route can leak an internal error to a caller. */
export async function serveApi(req, res, route) {
  try {
    await handleApi(req, res, route);
  } catch (err) {
    console.error('[api]', route, err.message);
    if (!res.headersSent) json(res, 500, { error: 'server error' });
  }
}
