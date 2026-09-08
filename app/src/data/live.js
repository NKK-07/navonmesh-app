// What the database actually says, kept separate from what the simulation says.
//
// The app used to read every screen out of mockHardware.js and never called
// its own API once. It looked healthier than a wired app would, because a
// simulation is always healthy, and it showed a farmer a batch belonging to
// somebody else at another unit because mock data has no idea a tenancy
// boundary exists.
//
// This module holds the real side. It never invents a number. Anything it
// could not fetch stays null, and a caller that finds null is expected to say
// so rather than substitute something plausible: `stale` and `lastFetchedAt`
// exist precisely so a screen can tell the difference between "8.2 degrees"
// and "8.2 degrees, from before the signal dropped".

import {
  getUnits, getBatches, getAlerts, getReadings, getMe, isSignedIn, getUser
} from '../utils/api.js';

/* One cache per user, not one per browser.
 *
 * The session token lives in sessionStorage, which is per tab, so a manager
 * and a farmer can be signed in at the same time in two tabs of the same
 * browser. They shared a single cache key, so whichever refreshed last wrote
 * over the other, and the farmer's tab could paint the manager's units on
 * load. Keying by user id keeps them apart and means signing out cannot leave
 * one person's produce behind for the next. */
const CACHE_PREFIX = 'navonmesh_live_cache';

function cacheKey() {
  const user = getUser();
  return user && user.id ? CACHE_PREFIX + ':' + user.id : CACHE_PREFIX;
}

/* Everything null until the first successful fetch. Deliberately not zeros:
   zero batches and unknown batches look identical in a template, and only one
   of them is worth showing to a farmer. */
const empty = () => ({
  me: null,
  units: null,
  batches: null,
  alerts: null,
  readings: null,
  lastFetchedAt: null,
  lastError: null,
  loading: false
});

let state = empty();
const listeners = new Set();

/** Read-only snapshot. */
export function live() {
  return state;
}

export function onLiveChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function publish(next) {
  state = next;
  for (const fn of listeners) {
    try { fn(state); } catch (err) { console.error('[live]', err); }
  }
}

/* The last good answer, so a farmer who opens the app underground sees their
   real produce from this morning rather than an empty screen. Kept per device
   in localStorage; it is their own data and it never leaves the phone. */
function readCache() {
  try {
    const raw = localStorage.getItem(cacheKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.lastFetchedAt ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(snapshot) {
  try {
    localStorage.setItem(cacheKey(), JSON.stringify({
      me: snapshot.me, units: snapshot.units, batches: snapshot.batches,
      alerts: snapshot.alerts, readings: snapshot.readings,
      lastFetchedAt: snapshot.lastFetchedAt
    }));
  } catch {}
}

export function clearLive() {
  /* Remove this user's cache and any stragglers from an older build that
     used the unkeyed name. */
  try {
    localStorage.removeItem(cacheKey());
    localStorage.removeItem(CACHE_PREFIX);
  } catch {}
  publish(empty());
}

/** Seconds since the data was last confirmed against the server. */
export function ageSeconds() {
  if (!state.lastFetchedAt) return null;
  return Math.max(0, Math.round((Date.now() - state.lastFetchedAt) / 1000));
}

/** True when the screen is showing something we could not just re-confirm. */
export function isStale(withinSeconds = 120) {
  const age = ageSeconds();
  return age === null ? true : age > withinSeconds;
}

export function describeAge(lang) {
  const age = ageSeconds();
  if (age === null) return null;
  if (age < 60) return 'just now';
  if (age < 3600) return Math.floor(age / 60) + ' min ago';
  if (age < 86400) return Math.floor(age / 3600) + ' h ago';
  return Math.floor(age / 86400) + ' d ago';
}

/**
 * Fetch everything the signed-in user can see.
 *
 * Partial success is success: if batches come back and readings time out, the
 * batches are kept. Losing good data because one of five calls failed is how
 * an app on a weak signal ends up showing nothing at all.
 */
export async function refreshLive({ unitId = null, only = null } = {}) {
  if (!isSignedIn()) { clearLive(); return state; }

  /* `only` exists because of latency, not tidiness. A full refresh is five
     calls to a database in Singapore, and after a farmer saves a price the
     only things that can have changed are their produce and the unit totals.
     Fetching alerts and 120 readings as well made a save take fifteen seconds
     and gave four more chances for one call to fail. */
  const want = new Set(only || ['me', 'units', 'batches', 'alerts', 'readings']);

  publish({ ...state, loading: true });

  const [me, unitsRes, batchesRes, alertsRes, readingsRes] = await Promise.all([
    want.has('me') ? getMe() : null,
    want.has('units') ? getUnits() : null,
    want.has('batches') ? getBatches() : null,
    want.has('alerts') ? getAlerts() : null,
    want.has('readings') ? getReadings(unitId, 120) : null
  ]);

  const anything = me || unitsRes || batchesRes || alertsRes || readingsRes;

  const next = {
    me: me || state.me,
    units: unitsRes ? unitsRes.units : state.units,
    batches: batchesRes ? batchesRes.batches : state.batches,
    alerts: alertsRes ? alertsRes.alerts : state.alerts,
    readings: readingsRes ? readingsRes.readings : state.readings,
    lastFetchedAt: anything ? Date.now() : state.lastFetchedAt,
    /* Kept, and shown. Every read swallows its own failure so a screen can
       fall back to cache, which is right, but silently leaving old numbers up
       with no mark on them is the same dishonesty the ONLINE badge used to
       commit. */
    lastError: anything ? null : 'could not reach the server',
    loading: false
  };

  publish(next);
  if (anything) writeCache(next);
  return next;
}

/**
 * Refresh after a write, and insist a bit.
 *
 * The write already succeeded, so the server state definitely changed; if the
 * read back fails we would otherwise show the farmer the values they just
 * replaced. One retry covers the common case of a single call timing out
 * against a compute that was asleep.
 */
export async function refreshAfterWrite() {
  const first = await refreshLive({ only: ['units', 'batches'] });
  if (!first.lastError) return first;
  return refreshLive({ only: ['units', 'batches'] });
}

/** Restore the last good answer so the first paint is not empty. */
export function hydrateFromCache() {
  const cached = readCache();
  if (cached) publish({ ...empty(), ...cached, loading: false });
  return state;
}

/* ------------------------------------------------------------- selectors */

export function unitFor(state_ = state) {
  const units = state_.units;
  return units && units.length ? units[0] : null;
}

export function latestReading(state_ = state) {
  const r = state_.readings;
  return r && r.length ? r[r.length - 1] : null;
}

/** Batches this user owns, which are the only ones they may edit. */
export function myBatches(state_ = state) {
  return (state_.batches || []).filter(b => b.is_mine);
}

export function openAlerts(state_ = state) {
  return (state_.alerts || []).filter(a => !a.cleared_at);
}

/**
 * The banner that goes at the top of a screen still fed by the simulation.
 *
 * The header used to show "ONLINE" with the class `live` over numbers that
 * came from mockHardware.js, which is not a smaller version of the truth, it
 * is the opposite of it. Anything the hardware has not actually reported now
 * says so in the one place a reader is looking.
 */
export function demoBanner(what) {
  return `
    <div class="demo-banner">
      <strong>Demo data</strong>
      <span>
        ${what} is simulated. No gateway is reporting readings for this unit
        yet, so these figures are illustrative. Your unit, produce, alerts and
        target temperature are real.
      </span>
    </div>
  `;
}

/** True once any real reading exists, so a screen can stop apologising. */
export function hasRealReadings() {
  return !!(state.readings && state.readings.length);
}
