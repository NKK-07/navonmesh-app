# NAVONMESH backend

Serves the site and the app, holds the data, and carries alerts from the LoRa
gateway to farmers' phones. Postgres with row level security, phone and PIN
auth, Web Push. Three dependencies.

## The one thing that will bite you

**Railway's `DATABASE_URL` is a superuser, and superusers bypass row level
security unconditionally.** Point the API at it and every policy in
`migrations/002_rls.sql` silently does nothing. The app will work. The tests
will pass. Every farmer will be able to read every other FPO.

So there are two connections, on purpose:

| Variable | Role | Used by | Bypasses RLS |
|---|---|---|---|
| `DATABASE_URL` | owner | migrations, seeding, push fan out | yes |
| `DATABASE_URL_APP` | `navonmesh_app` | every request | **no** |

`npm run provision` sets the app role's password and prints the URL.
`npm run provision -- --check` proves the role cannot bypass RLS and that every
table is both enabled and FORCEd. Run it after any migration that adds a table.

## Run it locally

```bash
docker run -d --name navonmesh-pg \
  -e POSTGRES_PASSWORD=devpass -e POSTGRES_USER=postgres -e POSTGRES_DB=navonmesh \
  -p 55432:5432 postgres:16-alpine

cd server
npm install
cp .env.example .env.local     # fill in JWT_SECRET
set -a; . ./.env.local; set +a

npm run migrate
npm run seed                   # prints demo logins and the gateway keys
npm run test:rls               # 18 assertions, all negatives
npm start
```

Then http://localhost:4000/app/

Demo logins: farmer `+915550000001` PIN `1234`, manager `+915550000009` PIN
`4321`. The 555 range is reserved, so no real phone is in a demo database.

## Deploy to Railway

1. **Add Postgres** to the project. Railway sets `DATABASE_URL`.
2. **Add this directory as a service.** Root directory `server`. The
   `railway.json` here runs migrations before boot and health checks
   `/api/health`.
3. **Set the variables** from `.env.example`. `JWT_SECRET` and the VAPID pair
   have no defaults on purpose.
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"  # JWT_SECRET
   npm run keys                                                                    # VAPID pair
   ```
   VAPID keys must be environment variables here, not the `vapid.json` file:
   Railway's filesystem is ephemeral, and regenerated keys invalidate every
   phone already subscribed.
4. **Provision the app role**, once, from a shell against the deployed
   database:
   ```bash
   APP_DB_PASSWORD='<something long>' npm run provision
   ```
   Paste the printed URL into `DATABASE_URL_APP` and redeploy.
5. **Verify** before trusting it:
   ```bash
   npm run provision -- --check
   npm run test:rls
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

## Two rules the policies encode

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
curl -X POST https://<your-app>.railway.app/api/device/alert \
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
| none | GET | `/api/health` | liveness and database check |
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

Rate limiting is in memory, so it resets on deploy and is per instance. The
per-account lockout is the durable defence; the IP limiter only blunts bursts.
Move it to Postgres or Redis before running more than one instance.

There is no registration endpoint. Users are seeded or created by an FPO
manager out of band, which is right for a scheme where an FPO vouches for its
members, and wrong the moment you want self signup.

Readings are never pruned. A unit reporting every minute writes about half a
million rows a year. Add a retention job or a `timescaledb` hypertable before
that matters.
