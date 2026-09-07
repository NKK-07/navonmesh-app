/* Database access, and the one rule that makes RLS trustworthy.
 *
 * Every query that serves a request goes through withUser() or withDevice().
 * Those open a transaction, stamp the caller's identity with `set local`, run
 * your work, and commit. `set local` is scoped to the transaction, so a
 * pooled connection physically cannot carry one request's identity into the
 * next, which is the failure mode that quietly turns RLS into decoration.
 *
 * There is a third helper, withOwner(), for migrations and provisioning. It
 * runs as the migration role and bypasses policies. Nothing that serves an
 * HTTP request may use it.
 */

import pg from 'pg';

const { Pool } = pg;

/* Railway hands you DATABASE_URL. Locally it points at the docker container. */
const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:devpass@localhost:55432/navonmesh';

/* Railway's internal network does not need TLS; its public proxy does. */
const needsSsl = /[?&]sslmode=require/.test(connectionString) ||
                 process.env.PGSSL === 'require';

export const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.PG_POOL_MAX || 8),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 8_000
});

pool.on('error', err => {
  console.error('[db] idle client error:', err.message);
});

/* The app role. Distinct from the migration role on purpose: it owns no
 * tables, so FORCE ROW LEVEL SECURITY actually binds it. */
const APP_URL = process.env.DATABASE_URL_APP || null;

export const appPool = APP_URL
  ? new Pool({
      connectionString: APP_URL,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
      max: Number(process.env.PG_POOL_MAX || 8)
    })
  : pool;

if (!APP_URL) {
  console.warn(
    '[db] DATABASE_URL_APP is not set, so queries run as the owning role and ' +
    'row level security will NOT be enforced. Set it before deploying.'
  );
}

async function inContext(settings, work) {
  const client = await appPool.connect();
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
  const client = await pool.connect();
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
