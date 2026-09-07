/* Migration runner.
 *
 * Applies every .sql file in migrations/ in filename order, once, inside a
 * transaction, and records it. Runs as the owning role, which is the one time
 * bypassing RLS is correct.
 *
 *   node migrate.js          apply anything pending
 *   node migrate.js --status show what has run
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, withOwner } from './db.js';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

async function ensureTable() {
  await withOwner(c => c.query(`
    create table if not exists schema_migrations (
      filename   text primary key,
      applied_at timestamptz not null default now()
    )
  `));
}

async function applied() {
  const { rows } = await withOwner(c =>
    c.query('select filename from schema_migrations order by filename'));
  return new Set(rows.map(r => r.filename));
}

async function run() {
  await ensureTable();
  const done = await applied();
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.sql')).sort();

  if (process.argv.includes('--status')) {
    for (const f of files) console.log((done.has(f) ? '  applied  ' : '  pending  ') + f);
    return;
  }

  let ran = 0;
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = fs.readFileSync(path.join(DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      /* The file carries its own begin/commit where it needs one. Wrapping
         the record in the same connection keeps the two in step. */
      await client.query(sql);
      await client.query(
        'insert into schema_migrations(filename) values ($1)', [file]);
      console.log('applied ' + file);
      ran++;
    } catch (err) {
      console.error('FAILED  ' + file);
      console.error('  ' + err.message);
      process.exitCode = 1;
      client.release();
      return;
    } finally {
      client.release();
    }
  }
  console.log(ran ? ran + ' migration(s) applied' : 'nothing to apply');
}

run()
  .catch(err => { console.error(err); process.exitCode = 1; })
  .finally(() => pool.end());
