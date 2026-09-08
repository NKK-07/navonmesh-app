/* Web Push delivery.
 *
 * Fan out runs as the OWNER, not as a user and not as the device. That is
 * deliberate and worth stating: an alert arrives with a device identity, and
 * a device is not allowed to read the users table or anyone's subscriptions.
 * Working out who to tell is a system job, so it happens here, in one place,
 * against one query, rather than by loosening a policy.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import webpush from 'web-push';
import { withOwner } from './db.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VAPID_FILE = path.join(HERE, '..', '..', 'server', 'vapid.json');
const SERVERLESS = !!process.env.VERCEL;

/* Loading is lazy and cached rather than done at import time. If it ran at
 * import, a deployment with the keys not yet set would fail every route,
 * including /api/health and login, and the first thing you would want to do
 * on such a deployment is check its health. Push is the only thing that
 * should break when push is unconfigured. */
let cached = null;

function loadVapid() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY
    };
  }

  /* In deployment the keys come from the environment. The filesystem is read
     only, and even where it is not, generating a fresh pair would silently
     invalidate every phone already subscribed. */
  if (SERVERLESS) {
    throw new Error(
      'VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are not set. Generate a pair ' +
      'with `npm run keys` and set both as environment variables.'
    );
  }

  if (fs.existsSync(VAPID_FILE)) {
    return JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8'));
  }

  const keys = webpush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_FILE, JSON.stringify(keys, null, 2));
  console.warn(
    '[push] Generated a new VAPID pair into server/vapid.json. In deployment ' +
    'set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY instead: the filesystem there ' +
    'is ephemeral, and new keys invalidate every existing subscription.'
  );
  return keys;
}

export function vapid() {
  if (!cached) {
    cached = loadVapid();
    webpush.setVapidDetails(
      process.env.VAPID_CONTACT || 'mailto:team@navonmesh.example',
      cached.publicKey,
      cached.privateKey
    );
  }
  return cached;
}

/** The public key, or null when push is not configured. Never throws: the
 *  browser asking for it is allowed to learn that push is unavailable. */
export function vapidPublicKey() {
  try { return vapid().publicKey; } catch { return null; }
}

/* A farmer asleep at 2am does not need to know the battery dipped. Anything
 * needing action still goes through: quiet hours mute noise, not emergencies. */
function inQuietHours(sub, now = new Date()) {
  const h = now.getHours();
  const { quiet_from: from, quiet_to: to } = sub;
  if (from === to) return false;
  return from > to ? (h >= from || h < to) : (h >= from && h < to);
}

/** Everyone who can see this unit, with their subscriptions. */
async function audienceFor(unitId) {
  const { rows } = await withOwner(c => c.query(`
    select s.id, s.user_id, s.endpoint, s.p256dh, s.auth,
           s.levels, s.quiet_from, s.quiet_to
      from push_subscriptions s
     where s.user_id in (
             select m.user_id from unit_members m where m.unit_id = $1
             union
             select u.id from users u
               join units n on n.fpo_id = u.fpo_id
              where n.id = $1 and u.role in ('fpo_manager', 'admin')
           )
  `, [unitId]));
  return rows;
}

async function logDelivery(alertId, userId, status, detail) {
  await withOwner(c => c.query(
    `insert into notifications(alert_id, user_id, channel, status, detail)
     values ($1, $2, 'push', $3, $4)`,
    [alertId, userId, status, detail || null]
  )).catch(() => {});   // the log must never fail the send
}

/**
 * Send one alert to every phone that should get it.
 * Returns { sent, skipped, expired, failed }.
 */
export async function fanOut(alert) {
  const tally = { sent: 0, skipped: 0, expired: 0, failed: 0 };

  /* An alert is worth more than its notification. If push is unconfigured the
     alert is still recorded and still shows in the app on next open, so this
     reports the miss rather than failing the gateway's call. */
  try {
    vapid();
  } catch (err) {
    console.error('[push]', err.message);
    return { ...tally, error: 'push not configured' };
  }

  const subs = await audienceFor(alert.unit_id);

  const payload = JSON.stringify({
    id: alert.id,
    level: alert.level,
    kind: alert.kind,
    title: alert.title,
    body: alert.body,
    action: alert.action,
    unit: alert.unit_code || null,
    at: alert.raised_at
  });

  await Promise.all(subs.map(async sub => {
    if (!sub.levels.includes(alert.level)) {
      tally.skipped++;
      return logDelivery(alert.id, sub.user_id, 'skipped', 'level not subscribed');
    }
    if (alert.level !== 'action' && inQuietHours(sub)) {
      tally.skipped++;
      return logDelivery(alert.id, sub.user_id, 'skipped', 'quiet hours');
    }

    const subscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth }
    };

    try {
      await webpush.sendNotification(subscription, payload);
      tally.sent++;
      await withOwner(c => c.query(
        `update push_subscriptions set last_ok_at = now(), failures = 0
          where id = $1`, [sub.id]));
      await logDelivery(alert.id, sub.user_id, 'sent');
    } catch (err) {
      /* 404 and 410 are the browser saying this install is gone. Anything
         else is transient, so the row survives and only a counter moves. */
      if (err.statusCode === 404 || err.statusCode === 410) {
        tally.expired++;
        await withOwner(c => c.query(
          'delete from push_subscriptions where id = $1', [sub.id]));
        await logDelivery(alert.id, sub.user_id, 'expired', 'endpoint gone');
      } else {
        tally.failed++;
        await withOwner(c => c.query(
          'update push_subscriptions set failures = failures + 1 where id = $1',
          [sub.id]));
        await logDelivery(alert.id, sub.user_id, 'failed',
                          String(err.statusCode || err.message).slice(0, 200));
      }
    }
  }));

  return tally;
}
