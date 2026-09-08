/* Sets the app role's password and prints the connection string to use.
 *
 * This exists because of one trap that will otherwise cost you an afternoon.
 * The role a managed Postgres hands you owns the schema, and usually is a
 * superuser as well. Either way it bypasses row level security. Point the API
 * at it and every policy in 002_rls.sql silently does nothing: the app works,
 * the tests pass, and every farmer can read every other FPO.
 *
 * So the API runs as navonmesh_app, which owns no tables and is not superuser.
 * The migration creates that role with a placeholder password. This sets a
 * real one and hands you the URL to paste into DATABASE_URL_APP.
 *
 *   APP_DB_PASSWORD='...' npm run provision
 *   npm run provision -- --check   verify the app role really is constrained
 */

import crypto from 'node:crypto';
import { pool, withOwner } from '../api/_lib/db.js';

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

async function setPassword() {
  const pw = process.env.APP_DB_PASSWORD ||
             crypto.randomBytes(24).toString('base64url');

  /* A role password cannot be parameterised, so it is quoted with Postgres's
     own literal quoting rather than interpolated by hand. */
  await withOwner(c => c.query(
    `do $do$ begin
       execute format('alter role navonmesh_app with login password %L', $1);
     end $do$`, [pw]
  ));

  const base = process.env.DATABASE_URL || '';
  let hint = 'postgres://navonmesh_app:' + pw + '@<host>:<port>/<database>';
  try {
    const u = new URL(base);
    u.username = 'navonmesh_app';
    u.password = pw;
    hint = u.toString();
  } catch { /* no DATABASE_URL to model it on */ }

  console.log('\nnavonmesh_app password set.\n');
  console.log('Set this as DATABASE_URL_APP on the service:\n');
  console.log('  ' + hint + '\n');
  console.log('Leave DATABASE_URL pointing at the owner: migrations need it,');
  console.log('and nothing that serves a request uses it.\n');
}

(CHECK ? check() : setPassword())
  .catch(err => { console.error(err); process.exitCode = 1; })
  .finally(() => pool.end());
