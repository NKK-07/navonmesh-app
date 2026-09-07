# NAVONMESH push relay

Serves the site and the app, and relays alerts to subscribed phones over Web
Push. One file, one dependency.

## Run it

    cd server
    npm install
    npm start

Then open http://localhost:4000/app/ and turn notifications on in Settings.

VAPID keys are generated on first boot into `server/vapid.json` and kept there.
That file and `subscriptions.json` are gitignored: regenerating the keys would
invalidate every subscription already handed out.

## What the gateway calls

In the real deployment the unit reports over 868 MHz LoRa, the gateway
receives it, and the gateway makes this one call. Everything else here exists
to serve that.

    curl -X POST http://localhost:4000/api/alert \
      -H "content-type: application/json" \
      -d '{
        "level": "action",
        "title": "Door open 9 minutes",
        "body": "Chamber at 12.4 C.",
        "action": "Close the door to hold temperature."
      }'

`level` is `action` or `info`, and a phone only receives the levels it
subscribed to. Subscriptions that come back 404 or 410 are dropped, because
that is the browser saying the install is gone.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | liveness, and the subscriber count |
| GET | `/api/vapid-public-key` | the key the browser subscribes with |
| POST | `/api/subscribe` | store a subscription |
| POST | `/api/unsubscribe` | drop one by endpoint |
| POST | `/api/alert` | fan an alert out to every matching subscriber |

## Limits worth knowing

Subscriptions live in a JSON file. That is right for one collection point and
wrong for a fleet: for many units, give each subscription a unit id and move
the store to a real database.

There is no authentication on `/api/alert`. On a local demo that is fine.
Anything public needs a shared secret on that route, or anyone who finds the
URL can notify every farmer.
