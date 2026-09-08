/* Runs a database script against exactly one database, named out loud.
 *
 *   node scripts/db.mjs local server/migrate.js
 *   node scripts/db.mjs neon  server/migrate.js
 *
 * There are two .env.local files and both define DATABASE_URL: ours at
 * server/.env.local points at the Docker container, and the Neon CLI writes
 * its own at the repo root and rewrites it on every link and deploy. Sourcing
 * both in a shell means whichever came last decides which database a
 * migration rewrites, which is not a thing that should depend on the order of
 * two dot files. So nothing sources anything; the target is an argument, and
 * this prints the host it resolved before it runs.
 *
 * Two mappings matter and are the reason this is a script rather than a pair
 * of --env-file flags:
 *
 * Schema work gets the DIRECT connection. Neon's pooled endpoint is PgBouncer
 * in transaction mode, which drops session state between statements, and the
 * failures do not mention pooling: a SET that silently does not persist, a
 * write landing in a read-only transaction inherited from an earlier client.
 *
 * Anything that SERVES REQUESTS gets the pooled one, and says so with --serve:
 *
 *   node scripts/db.mjs neon --serve server/server.js
 *
 * This started out unconditional: every launch took the direct host, on the
 * assumption that a runner called db.mjs only ever ran migrations. Then the
 * dev server was launched through it and served every request over the
 * endpoint reserved for schema work, which held until the compute went cold
 * and a login came back 500.
 *
 * DATABASE_URL_APP is cleared unless the target defines its own. It names the
 * non-owning role that RLS actually binds, and the local one points at
 * localhost. Carrying it into a Neon run would leave the owner pool on Neon
 * and the app pool on Docker: two databases, one process, and a test suite
 * reporting on neither.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TARGETS = {
  local: {
    label: 'local Docker',
    files: ['server/.env.local'],
    required: false
  },
  neon: {
    label: 'Neon',
    /* The CLI owns the root file. server/.env.neon is ours, holds what the
       CLI does not know about, and wins where they overlap. */
    files: ['server/.env.local', '.env.local', 'server/.env.neon'],
    required: true
  }
};

/* Enough dotenv for files we control: KEY=value, optional quotes, # comments. */
function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    const quoted = /^(['"])([\s\S]*)\1$/.exec(value);
    if (quoted) value = quoted[2];
    else value = value.replace(/\s+#.*$/, '').trim();
    out[m[1]] = value;
  }
  return out;
}

function describe(url) {
  try {
    const u = new URL(url);
    return {
      role: u.username,
      host: u.hostname,
      db: u.pathname.replace(/^\//, ''),
      pooled: u.hostname.includes('-pooler')
    };
  } catch {
    return null;
  }
}

const argv = process.argv.slice(2);
/* A long running server wants the pooler; migrations and the RLS suite want
   the direct endpoint. The flag is consumed here, never passed on. */
const SERVE = argv.includes('--serve');
const [targetName, script, ...rest] = argv.filter(a => a !== '--serve');
const target = TARGETS[targetName];

if (!target || !script) {
  console.error('usage: node scripts/db.mjs <' +
                Object.keys(TARGETS).join('|') + '> [--serve] <script.js> [args...]');
  process.exit(2);
}

const env = { ...process.env };
const loaded = [];

for (const file of target.files) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) continue;
  Object.assign(env, parseEnv(fs.readFileSync(full, 'utf8')));
  loaded.push(file);
}

if (targetName === 'neon') {
  if (!env.DATABASE_URL_UNPOOLED) {
    console.error(
      '\n  No DATABASE_URL_UNPOOLED. Run `neon link` (or `neon env pull`) to\n' +
      '  write the connection strings into .env.local, then try again.\n');
    process.exit(1);
  }
  /* Keep the pooled string reachable under its own name: provisioning needs it
     to print the URL the deployed app should use. */
  env.DATABASE_URL_POOLED = env.DATABASE_URL;

  /* Direct for schema work, pooled for anything that serves requests.
     This used to be direct unconditionally, on the assumption written into
     the comment above that everything launched here is laptop side schema
     work. That stopped being true the moment this ran server.js, which then
     served every request over the endpoint meant for migrations. --serve says
     which kind of thing is being launched, rather than leaving it to a guess
     about the filename. */
  env.DATABASE_URL = SERVE ? env.DATABASE_URL_POOLED : env.DATABASE_URL_UNPOOLED;

  /* server/.env.neon supplies this once the app role exists. Until then it
     must be absent rather than inherited from the local file, and it follows
     the same direct-or-pooled rule as the owner connection: both pools have to
     land on the same endpoint or the process straddles two of them. */
  const own = fs.existsSync(path.join(ROOT, 'server/.env.neon'))
    ? parseEnv(fs.readFileSync(path.join(ROOT, 'server/.env.neon'), 'utf8'))
    : {};
  const appUrl = SERVE
    ? (own.DATABASE_URL_APP_POOLED || own.DATABASE_URL_APP)
    : own.DATABASE_URL_APP;
  if (appUrl) env.DATABASE_URL_APP = appUrl;
  else delete env.DATABASE_URL_APP;
}

const owner = describe(env.DATABASE_URL);
const app = describe(env.DATABASE_URL_APP);

console.log('');
console.log('  target   ' + target.label + '  (' + targetName + ')');
if (owner) {
  console.log('  owner    ' + owner.role + '@' + owner.host + '/' + owner.db +
              (owner.pooled ? '   POOLED' : ''));
}
console.log('  app      ' + (app
  ? app.role + '@' + app.host + '/' + app.db + (app.pooled ? '   POOLED' : '')
  : 'not set, so RLS is not exercised'));
console.log('  env      ' + (loaded.join(', ') || 'none found'));
if (targetName === 'neon') {
  console.log('  endpoint ' + (SERVE ? 'pooled, serving requests'
                                     : 'direct, schema work'));
}
console.log('');

if (owner && owner.pooled && !SERVE) {
  console.log('  Warning: that is a pooled host. Schema work wants the direct one.\n');
}
if (owner && !owner.pooled && SERVE) {
  console.log('  Warning: serving requests over the direct endpoint. That is the\n' +
              '  one meant for migrations and it runs out of connections.\n');
}

spawn(process.execPath, [path.join(ROOT, script), ...rest],
      { stdio: 'inherit', env, cwd: ROOT })
  .on('exit', code => process.exit(code ?? 1));
