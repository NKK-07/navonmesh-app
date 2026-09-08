/* Proves the row level security policies actually bind.
 *
 * RLS fails silently. A missing FORCE, a superuser connection, or a policy
 * that reads the wrong setting all look exactly like a working system until
 * someone reads another FPO's data. So this asserts the negatives: not just
 * that a farmer sees their own unit, but that they cannot see the other one,
 * cannot forge an alert, cannot read someone's push subscriptions, and cannot
 * promote themselves.
 *
 *   npm run test:rls
 *
 * Requires DATABASE_URL_APP pointing at the navonmesh_app role. Without it
 * everything runs as the owner, which bypasses RLS, and the test says so
 * rather than passing green.
 */

import { pool, appPool, withUser, withDevice, withAnon, withOwner } from '../api/_lib/db.js';
import { hashDeviceKey } from '../api/_lib/auth.js';

let pass = 0, fail = 0;

function check(name, ok, detail) {
  if (ok) { pass++; console.log('  ok    ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  <- ' + detail : '')); }
}

async function main() {
  if (!process.env.DATABASE_URL_APP) {
    console.error(
      '\nDATABASE_URL_APP is not set. Every query would run as the table owner, ' +
      'which bypasses RLS, so this test could only ever pass vacuously.\n' +
      'Set it to the navonmesh_app role and run again.\n');
    process.exitCode = 1;
    return;
  }

  /* Look up the fixtures as owner. The test needs to know the ids; the point
     is what the APP role can do with them. */
  const ids = await withOwner(async c => {
    const q = async (sql, args) => (await c.query(sql, args)).rows[0];
    return {
      farmer1: (await q(`select id from users where phone = '+915550000001'`)).id,
      farmer4: (await q(`select id from users where phone = '+915550000004'`)).id,
      manager: (await q(`select id from users where phone = '+915550000009'`)).id,
      unit4:   (await q(`select id from units where code = 'NM-004'`)).id,
      unit5:   (await q(`select id from units where code = 'NM-005'`)).id
    };
  });

  console.log('\nrow level security\n');

  /* ---- units: a farmer sees theirs and only theirs ---- */
  const f1Units = await withUser(ids.farmer1, async c =>
    (await c.query('select code from units order by code')).rows.map(r => r.code));
  check('farmer on NM-004 sees exactly NM-004',
        f1Units.length === 1 && f1Units[0] === 'NM-004', f1Units.join(','));

  const f4Units = await withUser(ids.farmer4, async c =>
    (await c.query('select code from units order by code')).rows.map(r => r.code));
  check('farmer on NM-005 sees exactly NM-005',
        f4Units.length === 1 && f4Units[0] === 'NM-005', f4Units.join(','));

  const mUnits = await withUser(ids.manager, async c =>
    (await c.query('select code from units order by code')).rows.map(r => r.code));
  check('FPO manager sees both units of their FPO',
        mUnits.length === 2, mUnits.join(','));

  /* ---- no identity at all sees nothing ---- */
  const anon = await withAnon(async c =>
    (await c.query('select count(*)::int as n from units')).rows[0].n);
  check('a request with no identity sees no units', anon === 0, 'saw ' + anon);

  /* ---- alerts: the device writes, the farmer reads, neither crosses over ---- */
  await withDevice(ids.unit4, c => c.query(`
    insert into alerts (unit_id, level, kind, title, body)
    values ($1,'action','rls_probe','Probe','from the test')
    on conflict (unit_id, kind) where cleared_at is null do nothing`,
    [ids.unit4]));

  const f1SeesProbe = await withUser(ids.farmer1, async c =>
    (await c.query(`select count(*)::int n from alerts where kind='rls_probe'`)).rows[0].n);
  check('farmer on the unit sees its alert', f1SeesProbe === 1, 'saw ' + f1SeesProbe);

  const f4SeesProbe = await withUser(ids.farmer4, async c =>
    (await c.query(`select count(*)::int n from alerts where kind='rls_probe'`)).rows[0].n);
  check('farmer on another unit CANNOT see it', f4SeesProbe === 0, 'saw ' + f4SeesProbe);

  /* a signed in user must not be able to fabricate an alert */
  let forged = false;
  try {
    await withUser(ids.farmer1, c => c.query(`
      insert into alerts (unit_id, level, kind, title)
      values ($1,'action','forged','Forged by a user')`, [ids.unit4]));
    forged = true;
  } catch { /* expected */ }
  check('a signed in user cannot insert an alert', !forged);

  /* a device must not be able to write to a unit that is not its own */
  let crossed = false;
  try {
    await withDevice(ids.unit5, c => c.query(`
      insert into alerts (unit_id, level, kind, title)
      values ($1,'action','cross_unit','Wrong unit')`, [ids.unit4]));
    crossed = true;
  } catch { /* expected */ }
  check('a device cannot write an alert for another unit', !crossed);

  /* a device must not be able to read users */
  const deviceSawUsers = await withDevice(ids.unit4, async c =>
    (await c.query('select count(*)::int n from users')).rows[0].n);
  check('a device cannot read the users table', deviceSawUsers === 0,
        'saw ' + deviceSawUsers);

  /* ---- push subscriptions are personal ---- */
  await withUser(ids.farmer1, c => c.query(`
    insert into push_subscriptions (user_id, endpoint, p256dh, auth)
    values ($1,'https://example.invalid/rls-probe','k','a')
    on conflict (endpoint) do nothing`, [ids.farmer1]));

  const f1Subs = await withUser(ids.farmer1, async c =>
    (await c.query('select count(*)::int n from push_subscriptions')).rows[0].n);
  check('a user sees their own subscription', f1Subs >= 1, 'saw ' + f1Subs);

  const f4Subs = await withUser(ids.farmer4, async c =>
    (await c.query('select count(*)::int n from push_subscriptions')).rows[0].n);
  check('another user CANNOT see it', f4Subs === 0, 'saw ' + f4Subs);

  const mgrSubs = await withUser(ids.manager, async c =>
    (await c.query('select count(*)::int n from push_subscriptions')).rows[0].n);
  check('not even the manager can see it', mgrSubs === 0, 'saw ' + mgrSubs);

  /* ---- device keys are readable by nobody ----
     Stronger than an empty result: the app role holds no grant on the table
     at all, so this is a hard permission error rather than zero rows. A SQL
     injection that reaches this table still cannot enumerate keys. */
  let keyDenied = false, keysSeen = null;
  try {
    keysSeen = await withUser(ids.manager, async c =>
      (await c.query('select count(*)::int n from device_keys')).rows[0].n);
  } catch (err) {
    keyDenied = /permission denied/i.test(err.message);
  }
  check('the app role cannot touch device_keys at all',
        keyDenied, keysSeen === null ? 'unexpected error' : 'saw ' + keysSeen);

  /* but the lookup function still answers, without exposing the table */
  const probeKey = await withOwner(async c =>
    (await c.query('select key_hash from device_keys limit 1')).rows[0].key_hash);
  const resolved = await withAnon(async c =>
    (await c.query('select app_device_unit_for_key($1) as id', [probeKey])).rows[0].id);
  check('the key lookup function still resolves a unit', !!resolved);

  const bogus = await withAnon(async c =>
    (await c.query('select app_device_unit_for_key($1) as id',
                   [hashDeviceKey('not-a-real-token')])).rows[0].id);
  check('an unknown key resolves to nothing', bogus === null);

  /* ---- privilege escalation ---- */
  let escalated = false;
  try {
    await withUser(ids.farmer1, c => c.query(
      `update users set role = 'admin' where id = $1`, [ids.farmer1]));
    escalated = true;
  } catch { /* expected: the trigger */ }
  const stillFarmer = await withOwner(async c =>
    (await c.query('select role from users where id = $1', [ids.farmer1])).rows[0].role);
  check('a user cannot promote themselves to admin',
        !escalated && stillFarmer === 'farmer', 'role is ' + stillFarmer);

  let moved = false;
  try {
    await withUser(ids.farmer1, c => c.query(
      `update users set fpo_id = null where id = $1`, [ids.farmer1]));
    moved = true;
  } catch { /* expected */ }
  check('a user cannot move themselves between FPOs', !moved);

  /* a user must not be able to edit somebody else's row */
  const touched = await withUser(ids.farmer1, async c =>
    (await c.query(`update users set name = 'hacked' where id = $1 returning id`,
                   [ids.farmer4])).rowCount);
  check('a user cannot edit another user', touched === 0, 'rows ' + touched);

  /* ---- cleanup ---- */
  await withOwner(c => c.query(
    `delete from alerts where kind in ('rls_probe','forged','cross_unit')`));
  await withOwner(c => c.query(
    `delete from push_subscriptions where endpoint = 'https://example.invalid/rls-probe'`));

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed\n');
  if (fail) process.exitCode = 1;
}

main()
  .catch(err => { console.error('\n' + err.stack + '\n'); process.exitCode = 1; })
  .finally(async () => { await pool.end(); await appPool.end().catch(() => {}); });
