/* Demo data.
 *
 * Seeding is done in JavaScript rather than SQL because PINs have to be
 * hashed with the same function the login path verifies against. A SQL seed
 * would either hold plaintext or a hash nobody can reproduce.
 *
 * Runs as the owner, so it writes past RLS. That is correct here and nowhere
 * that serves a request.
 *
 *   node seed.js            create the demo FPO, units, farmers and keys
 *   node seed.js --reset    wipe those rows first
 */

import crypto from 'node:crypto';
import { pool, withOwner } from './db.js';
import { hashPin, hashDeviceKey } from './auth.js';

const RESET = process.argv.includes('--reset');

/* Real place, real crops, invented people. The phone numbers are in the
 * reserved 555 range so nobody's actual phone is in a demo database. */
const FPO = { name: 'Ri-Bhoi Farmer Producer Company', district: 'Ri-Bhoi' };

const USERS = [
  { phone: '+915550000001', name: 'Ramesh Das',      pin: '1234', role: 'farmer' },
  { phone: '+915550000002', name: 'Lalsangzuala',    pin: '1234', role: 'farmer' },
  { phone: '+915550000003', name: 'Marthang',        pin: '1234', role: 'farmer' },
  { phone: '+915550000004', name: 'Bikash Chettri',  pin: '1234', role: 'farmer' },
  { phone: '+915550000009', name: 'Fleet Manager',   pin: '4321', role: 'fpo_manager' }
];

const UNITS = [
  { code: 'NM-004', label: 'Umden collection centre', district: 'Ri-Bhoi' },
  { code: 'NM-005', label: 'Byrnihat collection centre', district: 'Ri-Bhoi' }
];

/* Farmers 1 to 3 share NM-004; farmer 4 is on NM-005 alone. That split is
 * what the RLS test leans on: farmer 4 must not see NM-004's alerts. */
const MEMBERSHIP = {
  'NM-004': ['+915550000001', '+915550000002', '+915550000003'],
  'NM-005': ['+915550000004']
};

const BATCHES = [
  { unit: 'NM-004', owner: '+915550000003', crop_id: 'king_chilli',    weight_kg: 35 },
  { unit: 'NM-004', owner: '+915550000001', crop_id: 'tomato',         weight_kg: 42 },
  { unit: 'NM-004', owner: '+915550000002', crop_id: 'cabbage',        weight_kg: 65 },
  { unit: 'NM-005', owner: '+915550000004', crop_id: 'khasi_mandarin', weight_kg: 44 }
];

async function main() {
  if (RESET) {
    await withOwner(c => c.query(
      `delete from fpos where name = $1`, [FPO.name]));   // cascades
    console.log('reset: removed the demo FPO and everything under it');
  }

  const out = await withOwner(async c => {
    const { rows: [fpo] } = await c.query(
      `insert into fpos (name, district) values ($1, $2)
       on conflict do nothing returning *`, [FPO.name, FPO.district]);

    const fpoRow = fpo || (await c.query(
      'select * from fpos where name = $1', [FPO.name])).rows[0];

    for (const u of USERS) {
      await c.query(`
        insert into users (phone, name, pin_hash, role, fpo_id)
        values ($1,$2,$3,$4,$5)
        on conflict (phone) do update
          set name = excluded.name, role = excluded.role, fpo_id = excluded.fpo_id`,
        [u.phone, u.name, await hashPin(u.pin), u.role, fpoRow.id]);
    }

    for (const un of UNITS) {
      await c.query(`
        insert into units (code, label, fpo_id, district)
        values ($1,$2,$3,$4)
        on conflict (code) do update set label = excluded.label`,
        [un.code, un.label, fpoRow.id, un.district]);
    }

    for (const [code, phones] of Object.entries(MEMBERSHIP)) {
      for (const phone of phones) {
        await c.query(`
          insert into unit_members (unit_id, user_id)
          select u.id, s.id from units u, users s
           where u.code = $1 and s.phone = $2
          on conflict do nothing`, [code, phone]);
      }
    }

    for (const b of BATCHES) {
      await c.query(`
        insert into batches (unit_id, owner_id, crop_id, weight_kg)
        select u.id, s.id, $3, $4 from units u, users s
         where u.code = $1 and s.phone = $2`,
        [b.unit, b.owner, b.crop_id, b.weight_kg]);
    }

    /* One gateway key per unit. The token is shown once, here, and only its
       sha256 is stored: there is no way to read it back later, which is the
       whole point. */
    const keys = [];
    for (const un of UNITS) {
      const token = 'nmg_' + crypto.randomBytes(24).toString('base64url');
      await c.query(`
        insert into device_keys (unit_id, key_hash, label)
        select id, $2, $3 from units where code = $1`,
        [un.code, hashDeviceKey(token), un.code + ' gateway']);
      keys.push({ unit: un.code, token });
    }
    return { keys };
  });

  console.log('\nSeeded.\n');
  console.log('  Sign in as a farmer:  +915550000001  PIN 1234');
  console.log('  Sign in as a manager: +915550000009  PIN 4321\n');
  console.log('  Gateway keys (shown once, only the hash is stored):');
  for (const k of out.keys) console.log('    ' + k.unit + '  ' + k.token);
  console.log('');
}

main()
  .catch(err => { console.error(err); process.exitCode = 1; })
  .finally(() => pool.end());
