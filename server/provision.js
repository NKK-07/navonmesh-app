/* Sets the app role's password and prints the connection string to use.
 *
 * This exists because of one trap that will otherwise cost you an afternoon.
 * The role a managed Postgres hands you bypasses row level security. Point the
 * API at it and every policy in 002_rls.sql silently does nothing: the app
 * works, the tests pass, and every farmer can read every other FPO.
 *
 * Note how it bypasses, because the obvious check misses it. On Neon,
 * neondb_owner is NOT a superuser, so testing rolsuper reports all clear. It
 * carries rolbypassrls instead, which is just as total. --check tests both,
 * and tests FORCE on every table, since an owner also ignores its own
 * policies on any table that was merely ENABLEd.
 *
 * So the API runs as navonmesh_app, which owns no tables and is not superuser.
 * The migration creates that role with a placeholder password. This sets a
 * real one and hands you the URL to paste into DATABASE_URL_APP.
 *
 *   APP_DB_PASSWORD='...' npm run provision
 *   npm run provision -- --check   verify the app role really is constrained
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, withOwner } from '../api/_lib/db.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHECK = process.argv.includes('--check');

async function check() {
  const rows = await withOwner(async c => (await c.query(`
    select rolname, rolsuper, rolbypassrls
      from pg_roles where rolname in ('navonmesh_app', current_user)
  `)).rows);

  console.log('\nrole                 superuser  bypasses RLS');
  for (const r of rows) {
    console.log('  ' + r.rolname.padEnd(19) +
                String(r.rolsuper).padEnd(11) + String(r.rolbypassrls));
  }

  const app = rows.find(r => r.rolname === 'navonmesh_app');
  if (!app) {
    console.log('\n  navonmesh_app does not exist. Run the migrations first.\n');
    process.exitCode = 1;
    return;
  }
  if (app.rolsuper || app.rolbypassrls) {
    console.log('\n  WRONG: navonmesh_app can bypass RLS. Every policy is inert.\n');
    process.exitCode = 1;
    return;
  }

  /* Ownership matters as much as superuser: an owner bypasses its own tables
     unless the table is FORCEd, and FORCE is easy to forget on a new table. */
  const unforced = await withOwner(async c => (await c.query(`
    select relname from pg_class
     where relnamespace = 'public'::regnamespace
       and relkind = 'r'
       and relrowsecurity = true
       and relforcerowsecurity = false
  `)).rows.map(r => r.relname));

  const unprotected = await withOwner(async c => (await c.query(`
    select relname from pg_class
     where relnamespace = 'public'::regnamespace
       and relkind = 'r'
       and relrowsecurity = false
       and relname <> 'schema_migrations'
  `)).rows.map(r => r.relname));

  if (unforced.length) console.log('\n  RLS enabled but not FORCEd: ' + unforced.join(', '));
  if (unprotected.length) console.log('  RLS not enabled at all:     ' + unprotected.join(', '));
  if (!unforced.length && !unprotected.length) {
    console.log('\n  every table has RLS enabled and forced');
  }
  console.log('');
  if (unforced.length || unprotected.length) process.exitCode = 1;
}

/** The same app role, spelled for one connection string. */
function appUrl(base, password) {
  try {
    const u = new URL(base);
    u.username = 'navonmesh_app';
    u.password = password;
    return u.toString();
  } catch {
    return 'postgres://navonmesh_app:' + password + '@<host>:<port>/<database>';
  }
}

async function setPassword() {
  const pw = process.env.APP_DB_PASSWORD ||
             crypto.randomBytes(24).toString('base64url');

  /* ALTER ROLE is DDL and cannot take a bind parameter, and a DO block cannot
     either: $1 inside $do$...$do$ is just text in the block body, which is why
     the earlier version of this failed with "bind message supplies 1
     parameters, but prepared statement requires 0".

     So the quoting happens in a statement that can take a parameter. format
     %L is Postgres quoting its own literal, which is the part that must not be
     done by hand, and the DDL it returns is then executed as a plain
     statement. The password never goes through string concatenation here. */
  await withOwner(async c => {
    const { rows } = await c.query(
      `select format('alter role navonmesh_app with login password %L', $1::text)
              as ddl`, [pw]);
    await c.query(rows[0].ddl);
  });

  const direct = appUrl(process.env.DATABASE_URL || '', pw);

  /* Two hosts, one role. Schema work and the RLS suite run from a laptop and
     want the direct endpoint; the deployed app is a swarm of short lived
     functions and wants the pooled one. Printing only the connected one is
     how the wrong string ends up in a dashboard. */
  const pooledBase = process.env.DATABASE_URL_POOLED;
  const pooled = pooledBase ? appUrl(pooledBase, pw) : null;

  console.log();
  console.log('navonmesh_app password set.');
  console.log();

  if (pooled) {
    console.log('For the deployment, as DATABASE_URL_APP (pooled):');
    console.log();
    console.log('  ' + pooled);
    console.log();
    console.log('For schema work and the RLS suite from here (direct):');
  } else {
    console.log('Set this as DATABASE_URL_APP:');
  }
  console.log();
  console.log('  ' + direct);
  console.log();

  if (process.argv.includes('--write-env')) {
    const target = process.env.NEON_BRANCH ? 'server/.env.neon' : 'server/.env.app';
    const file = path.join(HERE, '..', target);
    const body = [
      '# Written by `npm run neon:provision -- --write-env`. Gitignored.',
      '#',
      '# Both spellings of the same role. They are not interchangeable.',
      '#',
      '# DATABASE_URL_APP is the direct endpoint and the only line read from',
      '# here, by schema work and the RLS suite on this machine.',
      'DATABASE_URL_APP=' + direct,
      '',
      '# The pooled endpoint, for copying into the deployment as its own',
      '# DATABASE_URL_APP. Nothing reads it from this file; short lived',
      '# functions need the pooler, laptop scripts must not use it.',
      'DATABASE_URL_APP_POOLED=' + (pooled || direct),
      ''
    ].join('\n');
    fs.writeFileSync(file, body, { mode: 0o600 });
    console.log('Wrote ' + target + ' with both URLs, so the password did not');
    console.log('have to be copied by hand. It is gitignored.');
    console.log();
  }

  console.log('Leave DATABASE_URL pointing at the owner: migrations need it,');
  console.log('and nothing that serves a request uses it.');
  console.log();
}

(CHECK ? check() : setPassword())
  .catch(err => { console.error(err); process.exitCode = 1; })
  .finally(() => pool.end());
