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

**The database's own role bypasses row level security.** It owns the tables,
and an owner ignores its own policies unless the table is FORCEd; on most
managed Postgres the role you are given is a superuser too, and a superuser
bypasses RLS unconditionally, FORCE or not. Point the API at it and every
policy in `migrations/002_rls.sql` silently does nothing. The app will work.
The tests will pass. Every farmer will be able to read every other FPO.

So there are two connections, on purpose:

| Variable | Role | Used by | Bypasses RLS |
|---|---|---|---|
| `DATABASE_URL` | owner | migrations, seeding, login lookup, push fan out | yes |
| `DATABASE_URL_APP` | `navonmesh_app` | every request that reads data | **no** |

`npm run provision` sets the app role's password and prints the URL.
`npm run provision -- --check` proves the role cannot bypass RLS and that every
table is both enabled and FORCEd. Run it after any migration that adds a table.

## Run it locally

```bash
docker run -d --name navonmesh-pg \
  -e POSTGRES_PASSWORD=devpass -e POSTGRES_USER=postgres -e POSTGRES_DB=navonmesh \
  -p 55432:5432 postgres:16-alpine

npm install                    # from the repo root
cp server/.env.example server/.env.local     # fill in JWT_SECRET
set -a; . ./server/.env.local; set +a

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

1. **Create a Neon project.** Copy the **pooled** connection string, the host
   with `-pooler` in it. Transaction pooling is correct here because every
   query already runs inside its own transaction; a direct endpoint will run
   out of connections once functions scale.

2. **Migrate and seed from your machine.** There is no build step on the
   platform that could do it, which is a feature: a migration should be a thing
   you ran, not a thing a deploy did to you.
   ```bash
   export DATABASE_URL='postgres://...neon.tech/neondb?sslmode=require'
   npm run migrate
   npm run seed
   ```

3. **Provision the app role** against that same database:
   ```bash
   APP_DB_PASSWORD='<something long>' npm run provision
   ```
   Keep the URL it prints.

4. **Set the environment variables** on the Vercel project, for Production,
   Preview and Development:

   | | |
   |---|---|
   | `DATABASE_URL` | the Neon pooled string |
   | `DATABASE_URL_APP` | what step 3 printed |
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
   npm run provision -- --check
   npm run test:rls                                # against DATABASE_URL_APP
   ```

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
