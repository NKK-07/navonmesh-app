/* Database access, and the one rule that makes RLS trustworthy.
 *
 * Every query that serves a request goes through withUser() or withDevice().
 * Those open a transaction, stamp the caller's identity with `set local`, run
 * your work, and commit. `set local` is scoped to the transaction, so a
 * pooled connection physically cannot carry one request's identity into the
 * next, which is the failure mode that quietly turns RLS into decoration.
 *
 * That design happens to be exactly what a serverless deployment needs. Neon
 * puts PgBouncer in front of the database in transaction pooling mode, where
 * session state does not survive between statements. Anything that stamped
 * identity per connection would break there. Per transaction is the only
 * shape that is both correct and poolable.
 *
 * There is a third helper, withOwner(), for migrations and provisioning. It
 * runs as the migration role and bypasses policies. Nothing that serves an
 * HTTP request may use it, with one deliberate exception: login, which has no
 * identity to scope by yet, and push fan out, which is a system job.
 */

import pg from 'pg';

const { Pool } = pg;

const OWNER_URL =
  process.env.DATABASE_URL ||
  'postgres://postgres:devpass@localhost:55432/navonmesh';

/* The app role. Distinct from the migration role on purpose: it owns no
 * tables, so FORCE ROW LEVEL SECURITY actually binds it. */
const APP_URL = process.env.DATABASE_URL_APP || null;

/* On a serverless platform each warm instance holds its own pool, and there
 * may be many instances. One connection each keeps well inside Neon's limit;
 * concurrency comes from instances, not from sockets per instance. Locally,
 * one process serves everything, so it wants a real pool. */
const SERVERLESS = !!process.env.VERCEL;
const POOL_MAX = Number(process.env.PG_POOL_MAX || (SERVERLESS ? 1 : 8));

/* Anything not on this machine is reached over the public internet, so the
 * certificate gets verified. Neon presents a normally trusted chain, so this
 * needs no extra configuration; PGSSL_INSECURE exists only for a host that
 * presents a self signed certificate. */
function sslFor(url) {
  let host = '';
  try { host = new URL(url).hostname; } catch { /* not a URL we can read */ }
  const local = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (local && process.env.PGSSL !== 'require') return undefined;
  return { rejectUnauthorized: process.env.PGSSL_INSECURE !== '1' };
}

function makePool(url, max) {
  return new Pool({
    connectionString: url,
    ssl: sslFor(url),
    max,
    idleTimeoutMillis: SERVERLESS ? 10_000 : 30_000,
    /* Neon suspends a compute that has been idle a few minutes, and the first
       connection after that has to wake it. 10s was not enough: a cold login
       came back "Connection terminated due to connection timeout" and the
       farmer saw a 500. */
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 20_000)
  });
}

/* One retry, and only on failure to GET a connection.
 *
 * This is safe precisely because nothing has run yet: no transaction is open,
 * no statement has been sent, so a second attempt cannot repeat a write. A
 * retry anywhere later would not be safe and is not done.
 *
 * Worth the code because of how this product is used. Farmers check the
 * chamber in the morning and again in the evening, so the compute is usually
 * asleep when someone actually needs it, and the very first request of the day
 * is the one most likely to land on a cold start. */
async function connect(pool) {
  try {
    return await pool.connect();
  } catch (err) {
    const cold = /timeout|ECONNRESET|ETIMEDOUT|Connection terminated/i.test(err.message || '');
    if (!cold) throw err;
    console.warn('[db] cold connection, retrying once:', err.message);
    return pool.connect();
  }
}

export const pool = makePool(OWNER_URL, POOL_MAX);

export const appPool = APP_URL ? makePool(APP_URL, POOL_MAX) : pool;

for (const p of new Set([pool, appPool])) {
  p.on('error', err => console.error('[db] idle client error:', err.message));
}

if (!APP_URL) {
  console.warn(
    '[db] DATABASE_URL_APP is not set, so queries run as the owning role and ' +
    'row level security will NOT be enforced. Set it before deploying.'
  );
}

async function inContext(settings, work) {
  const client = await connect(appPool);
  try {
    await client.query('begin');
    for (const [key, value] of Object.entries(settings)) {
      /* set_config with a parameter, never string interpolation: the value is
         a uuid from a verified token, but this path must not be the one that
         teaches someone that concatenating into SQL is ever fine. */
      await client.query('select set_config($1, $2, true)', [key, value ?? '']);
    }
    const result = await work(client);
    await client.query('commit');
    return result;
  } catch (err) {
    await client.query('rollback').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** Run work as a signed in user. Policies see app.user_id. */
export function withUser(userId, work) {
  return inContext({ 'app.user_id': userId }, work);
}

/** Run work as a gateway. Policies see app.device_unit_id and nothing else. */
export function withDevice(unitId, work) {
  return inContext({ 'app.device_unit_id': unitId }, work);
}

/** No identity at all: policies deny everything except what is explicitly
 *  public. Used for login, where there is no user yet. */
export function withAnon(work) {
  return inContext({}, work);
}

/** Owner connection: bypasses RLS. Migrations and provisioning only. */
export async function withOwner(work) {
  const client = await connect(pool);
  try {
    return await work(client);
  } finally {
    client.release();
  }
}

export async function health() {
  const { rows } = await pool.query('select now() as at');
  return rows[0].at;
}
