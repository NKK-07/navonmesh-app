/* Authentication.
 *
 * Two kinds of caller, deliberately separate.
 *
 *   A user  is a person: phone plus a PIN. Farmers in Ri-Bhoi have phones,
 *           most do not have email, so phone is the identity. A PIN is short,
 *           which is exactly why the lockout below is not optional.
 *   A device is the LoRa gateway: a bearer token scoped to one unit. It can
 *           write that unit's alerts and readings and read nothing at all.
 *
 * PINs are hashed with scrypt from node:crypto. No native build step, which
 * matters on a serverless runtime, and no dependency to keep patched.
 */

import crypto from 'node:crypto';
import { promisify } from 'node:util';
import jwt from 'jsonwebtoken';
import { withAnon, withOwner, appPool } from './db.js';

const scrypt = promisify(crypto.scrypt);

/* Deliberately above the defaults. A 4 digit PIN has 10,000 possibilities, so
 * the hash has to be the expensive part. */
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 32) {
  console.error(
    '[auth] JWT_SECRET is missing or too short. Set a random 32+ character ' +
    'value in the deployment environment before this serves anyone.'
  );
}
const TOKEN_TTL = process.env.JWT_TTL || '30d';   // a farmer should not be
                                                  // logged out in a field

/* ------------------------------------------------------------ pin hashing */

export async function hashPin(pin) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(String(pin), salt, SCRYPT.keylen, SCRYPT);
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p,
          salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPin(pin, stored) {
  try {
    const [scheme, N, r, p, saltB64, keyB64] = String(stored).split('$');
    if (scheme !== 'scrypt') return false;
    const salt = Buffer.from(saltB64, 'base64');
    const expected = Buffer.from(keyB64, 'base64');
    const actual = await scrypt(String(pin), salt, expected.length,
                                { N: +N, r: +r, p: +p });
    /* constant time, so a wrong PIN cannot be found one byte at a time */
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/* ---------------------------------------------------------------- tokens */

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name },
    SECRET,
    { expiresIn: TOKEN_TTL, issuer: 'navonmesh' }
  );
}

export function readToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.slice(7), SECRET, { issuer: 'navonmesh' });
  } catch {
    return null;
  }
}

/* --------------------------------------------------------------- lockout */

/* Runs as the owner because a failed login has no user context yet, and the
 * counter must move even when the caller proved nothing. */
async function noteFailure(phone) {
  await withOwner(c => c.query(
    `update users
        set failed_logins = failed_logins + 1,
            locked_until = case when failed_logins + 1 >= $2
                                then now() + ($3 || ' minutes')::interval
                                else locked_until end
      where phone = $1`,
    [phone, MAX_FAILED, LOCK_MINUTES]
  ));
}

async function clearFailures(id) {
  await withOwner(c => c.query(
    `update users set failed_logins = 0, locked_until = null,
                      last_seen_at = now() where id = $1`, [id]
  ));
}

/* ----------------------------------------------------------------- login */

export async function login(phone, pin) {
  /* The lookup runs as owner because there is no identity to scope by yet.
     It reads one row by phone and returns nothing that is not needed. */
  const { rows } = await withOwner(c => c.query(
    `select id, phone, name, pin_hash, role, fpo_id, lang,
            failed_logins, locked_until
       from users where phone = $1`, [phone]
  ));
  const user = rows[0];

  /* Same shape of answer whether the phone exists or not, so this endpoint
     cannot be used to find out who is registered. */
  if (!user) {
    await scrypt('decoy', crypto.randomBytes(16), 64, SCRYPT); // equal cost
    return { ok: false, reason: 'invalid' };
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return { ok: false, reason: 'locked', until: user.locked_until };
  }

  const good = await verifyPin(pin, user.pin_hash);
  if (!good) {
    await noteFailure(phone);
    return { ok: false, reason: 'invalid' };
  }

  await clearFailures(user.id);
  return {
    ok: true,
    token: signToken(user),
    user: {
      id: user.id, name: user.name, phone: user.phone,
      role: user.role, lang: user.lang, fpoId: user.fpo_id
    }
  };
}

/* ---------------------------------------------------------------- device */

export function hashDeviceKey(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

/** Resolves a gateway bearer token to the one unit it may write to.
 *  Uses the security definer lookup, so the app role never reads the key
 *  table itself. */
export async function deviceUnitFor(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const hash = hashDeviceKey(header.slice(7));

  const client = await appPool.connect();
  try {
    const { rows } = await client.query(
      'select app_device_unit_for_key($1) as unit_id', [hash]
    );
    const unitId = rows[0] && rows[0].unit_id;
    if (unitId) {
      await client.query(
        'update device_keys set last_seen_at = now() where key_hash = $1', [hash]
      ).catch(() => {});   // best effort: a stats write must not fail an alert
    }
    return unitId || null;
  } finally {
    client.release();
  }
}

export { MAX_FAILED, LOCK_MINUTES };
