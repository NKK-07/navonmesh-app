/* Fires one alert at a unit, the way the LoRa gateway will, and reports what
 * came back. This is the only end to end check for push that exists: every
 * other part can be verified from a terminal, but whether a notification
 * actually appears on a phone depends on the browser, the OS, and in practice
 * on Windows or Android battery settings that no test can see.
 *
 *   npm run alert:test              against the deployment
 *   npm run alert:test -- --local   against localhost:4000
 *   npm run alert:test -- --clear   clear it again
 *
 * The gateway key is read from the file `npm run neon:seed` wrote, so it never
 * has to be pasted anywhere.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const LOCAL = args.includes('--local');
const CLEAR = args.includes('--clear');

const BASE = process.env.NAVONMESH_URL ||
  (LOCAL ? 'http://localhost:4000' : 'https://navonmesh-app.vercel.app');

const KEY_FILE = path.join(ROOT, LOCAL ? 'server/.seed-keys.txt' : 'server/.neon-seed-keys.txt');

function gatewayKey() {
  if (process.env.GATEWAY_KEY) return process.env.GATEWAY_KEY;
  if (!fs.existsSync(KEY_FILE)) {
    console.error('\n  No gateway key. Either set GATEWAY_KEY, or re-run the seed\n' +
                  '  and keep its output:\n\n' +
                  '    npm run ' + (LOCAL ? 'seed' : 'neon:seed') + '\n');
    process.exit(1);
  }
  const m = fs.readFileSync(KEY_FILE, 'utf8').match(/nmg_[A-Za-z0-9_-]+/);
  if (!m) { console.error('\n  ' + KEY_FILE + ' holds no key.\n'); process.exit(1); }
  return m[0];
}

const body = CLEAR
  ? { kind: 'test_alert' }
  : {
      level: 'action',
      kind: 'test_alert',
      title: 'Door open 9 minutes',
      body: 'Chamber at 12.4 C and rising.',
      action: 'Close the door to hold temperature.'
    };

const res = await fetch(BASE + (CLEAR ? '/api/device/clear' : '/api/device/alert'), {
  method: 'POST',
  headers: { authorization: 'Bearer ' + gatewayKey(), 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

const out = await res.json().catch(() => ({}));

console.log('\n  ' + BASE + (CLEAR ? '/api/device/clear' : '/api/device/alert'));
console.log('  HTTP ' + res.status + '\n');

if (CLEAR) {
  console.log('  cleared ' + (out.cleared ?? 0) + ' open alert(s)\n');
} else if (out.delivery) {
  const d = out.delivery;
  console.log('  sent    ' + d.sent + '   phones that got it');
  console.log('  skipped ' + d.skipped + '   quiet hours, or not subscribed to this level');
  console.log('  expired ' + d.expired + '   subscriptions the browser has dropped');
  console.log('  failed  ' + d.failed + '   push service refused\n');
  if (d.error) console.log('  ' + d.error + '\n');
  else if (!d.sent && !d.skipped && !d.expired && !d.failed) {
    console.log('  Nobody is subscribed on this database yet. Open the app, sign in,\n' +
                '  and turn notifications on: the subscription is created by that tap\n' +
                '  and cannot be created from here.\n');
  }
} else {
  console.log('  ' + JSON.stringify(out) + '\n');
}

process.exitCode = res.ok ? 0 : 1;
