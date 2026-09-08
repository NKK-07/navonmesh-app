# NAVONMESH backend

Holds the data and carries alerts from the LoRa gateway to farmers' phones.
Postgres with row level security, phone and PIN auth, Web Push. Three
dependencies.

## Where the code lives

The API is not in this directory. It is at the repo root, because the platform
serving it looks there:

```
api/[...path].js     the deployed entry point, one catch-all function
api/_lib/db.js       connections, and the transaction that stamps identity
api/_lib/auth.js     scrypt PINs, JWTs, gateway keys, lockout
api/_lib/push.js     Web Push fan out
api/_lib/routes.js   every endpoint, host agnostic
```

This directory holds the things that run from your machine, not inside a
request: migrations, seeding, provisioning, the RLS test suite, and a small
http server that serves the static site and the API together on one port so
local development is one command.

## The one thing that will bite you

**The role your provider hands you bypasses row level security.** Point the API
at it and every policy in `migrations/002_rls.sql` silently does nothing. The
app will work. The tests will pass. Every farmer will be able to read every
other FPO.

It is worth knowing *how* it bypasses, because the obvious check misses it.
On Neon, `neondb_owner` is **not** a superuser, so anything that tests
`rolsuper` reports all clear. It carries `rolbypassrls` instead, which is just
as total. Measured on this project's own branch:

```
role                 superuser  bypasses RLS
  neondb_owner       false      true
  navonmesh_app      false      false
```

That is the entire reason for the second connection.

So there are two connections, on purpose:

| Variable | Role | Used by | Bypasses RLS |
|---|---|---|---|
| `DATABASE_URL` | owner | migrations, seeding, login lookup, push fan out | yes |
| `DATABASE_URL_APP` | `navonmesh_app` | every request that reads data | **no** |

`npm run provision` sets the app role's password and prints the URL.
`npm run provision -- --check` proves the role cannot bypass RLS and that every
table is both enabled and FORCEd. Run it after any migration that adds a table.

## Which database a command talks to

Nothing sources a `.env` file by hand, because there are two and both define
`DATABASE_URL`: ours at `server/.env.local` points at the Docker container,
and the Neon CLI writes its own at the repo root and rewrites it on every
`neon link` and `neon deploy`. Whichever got sourced last would decide which
database a migration rewrites.

So the target is a word in the command, and `scripts/db.mjs` prints the host
it resolved before it runs anything:

| | |
|---|---|
| `npm run migrate` | Docker |
| `npm run neon:migrate` | Neon |

Same for `seed`, `provision`, `test:rls` and `migrate:status`. The runner also
swaps in the **direct** endpoint for Neon, since everything it launches is
schema work, and drops `DATABASE_URL_APP` unless the target defines its own —
otherwise a Neon run would leave the owner pool on Neon and the app pool on
Docker, and the RLS suite would report on neither.

## Run it locally

```bash
docker run -d --name navonmesh-pg \
  -e POSTGRES_PASSWORD=devpass -e POSTGRES_USER=postgres -e POSTGRES_DB=navonmesh \
  -p 55432:5432 postgres:16-alpine

npm install                                  # from the repo root
cp server/.env.example server/.env.local     # fill in JWT_SECRET

npm run migrate
npm run seed                   # prints demo logins and the gateway keys
npm run test:rls               # 18 assertions, all negatives
npm run dev
```

Then http://localhost:4000/app/

Demo logins: farmer `+915550000001` PIN `1234`, manager `+915550000009` PIN
`4321`. The 555 range is reserved, so no real phone is in a demo database.

## Deploy

Postgres on **Neon**, the API as a **Vercel function** on the same project that
already serves the site. Same origin, so the app's `API_BASE` stays empty and
there is no CORS anywhere.

1. **Link the project**, which writes both connection strings into
   `.env.local` and gitignores it:
   ```bash
   neon link --project-id <id> --branch production
   ```

2. **Migrate and seed from your machine.** There is no build step on the
   platform that could do it, which is a feature: a migration should be a thing
   you ran, not a thing a deploy did to you.
   ```bash
   npm run neon:migrate
   npm run neon:seed
   ```

3. **Provision the app role** against that same database:
   ```bash
   APP_DB_PASSWORD='<something long>' npm run neon:provision -- --write-env
   ```
   It prints two URLs for the same role and they are not interchangeable. The
   **pooled** one goes to the deployment, below. The **direct** one is written
   to `server/.env.neon` for the RLS suite, so the password never has to be
   copied by hand.

4. **Set the environment variables** on the Vercel project, for Production,
   Preview and Development:

   | | |
   |---|---|
   | `DATABASE_URL` | the Neon **pooled** string, from `.env.local` |
   | `DATABASE_URL_APP` | the **pooled** URL step 3 printed |
   | `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
   | `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | `npm run keys` |
   | `VAPID_CONTACT` | `mailto:` you |

   The VAPID pair must be variables, not `server/vapid.json`: the deployed
   filesystem is read only, and regenerated keys invalidate every phone already
   subscribed. Use the pair already in `server/vapid.json` if phones are
   subscribed to it.

5. **Verify** before trusting it:
   ```bash
   curl https://<your-app>.vercel.app/api/health   # ok true, db up, push true
   npm run neon:provision -- --check
   npm run neon:test:rls
   ```

   `--check` is the one that matters. It proves the app role cannot bypass RLS
   and that every table is both enabled and FORCEd, which is the property the
   whole tenancy model rests on and the one that fails silently.

## The tenancy model

An FPO owns units. A farmer belongs to an FPO and is a member of the units they
actually store produce in. A farmer sees their own units; an FPO manager sees
every unit their FPO owns; nobody sees another FPO.

The gateway is not a user. It holds a bearer key scoped to one unit, can write
that unit's alerts and readings, and can read nothing else. A leaked gateway key
cannot reach a farmer's produce or contact details.

Identity is a phone number and a four digit PIN. Farmers in Ri-Bhoi have phones
and most do not have email. A PIN is weak, which is why an account locks for 15
minutes after 5 wrong tries, the lockout survives a restart, and it cannot be
dodged by changing IP address.

## Three rules the code encodes

**Identity is stamped per transaction, never per connection.** `set local`
dies at commit, so a pooled connection cannot carry one request's identity into
the next. This is what makes RLS trustworthy behind PgBouncer and what makes
the whole thing safe to run serverless at all.

**A policy on a table must never read that table directly.** It recurses. Any
lookup a policy needs goes through a `security definer` function with a pinned
`search_path`. This cost a real debugging session: `users_select` contained a
subquery on `users`.

**`RETURNING` and `ON CONFLICT` need a SELECT policy, not just INSERT.** A
plain insert succeeds while `insert ... returning` fails with "new row violates
row-level security policy", which reads like a WITH CHECK problem and is not
one. `003_device_read.sql` exists because of this.

## The gateway API

In deployment the unit reports over 868 MHz LoRa, the gateway receives it, and
the gateway makes one call. Everything else here exists to serve that.

```bash
curl -X POST https://<your-app>.vercel.app/api/device/alert \
  -H "authorization: Bearer nmg_..." \
  -H "content-type: application/json" \
  -d '{
    "level": "action",
    "kind": "door_open",
    "title": "Door open 9 minutes",
    "body": "Chamber at 12.4 C.",
    "action": "Close the door to hold temperature."
  }'
```

`kind` is the dedupe key: one open alert per kind per unit, so a retrying
gateway updates rather than stacking notifications on a farmer's phone. Clear
it with `POST /api/device/clear {"kind":"door_open"}`.

## Endpoints

| Auth | Method | Path | |
|---|---|---|---|
| none | GET | `/api/health` | liveness, database and push configuration |
| none | GET | `/api/vapid-public-key` | key the browser subscribes with |
| none | POST | `/api/auth/login` | phone and PIN, returns a JWT |
| user | GET | `/api/me` | |
| user | GET | `/api/units` | scoped by RLS |
| user | GET | `/api/alerts` | scoped by RLS |
| user | POST | `/api/alerts/:id/ack` | |
| user | GET | `/api/batches` | scoped by RLS |
| user | POST | `/api/push/subscribe` | |
| user | POST | `/api/push/unsubscribe` | |
| device | POST | `/api/device/alert` | raise or update an alert |
| device | POST | `/api/device/clear` | clear by kind |
| device | POST | `/api/device/reading` | telemetry |

## Known limits

Rate limiting is in memory, so on a serverless runtime it is per instance and
resets on every cold start. It was never the real defence: that is the
per-account lockout, which lives in Postgres, is shared by every instance, and
cannot be dodged by changing IP. Move the IP limiter to Postgres before it is
load bearing.

Push fan out is synchronous inside the alert request. With a handful of phones
per unit that is fine; with hundreds it will approach the function's time
limit and wants a queue.

There is no registration endpoint. Users are seeded or created by an FPO
manager out of band, which is right for a scheme where an FPO vouches for its
members, and wrong the moment you want self signup.

Readings are never pruned. A unit reporting every minute writes about half a
million rows a year. Add a retention job or a `timescaledb` hypertable before
that matters.
