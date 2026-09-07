// NAVONMESH notifications.
//
// Two delivery paths, and they are not the same thing.
//
//   Local  - the app itself notices a new alert and posts a notification
//            through the service worker. Works with no server, but only while
//            the app is open or backgrounded.
//   Push   - the LoRa gateway POSTs to /api/alert and the push service wakes
//            the phone. This is the one that works with the app fully closed,
//            and it is the reason there is a server at all.
//
// SMS over the LoRa link stays the fallback underneath both, for handsets with
// no data at all. Nothing here replaces that.

import { apiFetch } from './api.js';

const PREF_KEY = 'navonmesh_notify_prefs';
const SEEN_KEY = 'navonmesh_notify_seen';

const DEFAULTS = {
  enabled: false,
  levels: { action: true, info: false },   // info alerts are noise on a phone
  quietHours: { on: true, from: 21, to: 5 } // 21:00 to 05:00, local time
};

/* ------------------------------------------------------------- support */

export function isSupported() {
  return 'Notification' in window &&
         'serviceWorker' in navigator &&
         'PushManager' in window;
}

export function permission() {
  return isSupported() ? Notification.permission : 'unsupported';
}

/* ------------------------------------------------------------ settings */

export function getPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
    return {
      ...DEFAULTS,
      ...saved,
      levels: { ...DEFAULTS.levels, ...(saved.levels || {}) },
      quietHours: { ...DEFAULTS.quietHours, ...(saved.quietHours || {}) }
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setPrefs(patch) {
  const next = { ...getPrefs(), ...patch };
  try { localStorage.setItem(PREF_KEY, JSON.stringify(next)); } catch {}
  return next;
}

/* A farmer asleep at 2am does not need to know the battery dipped. Anything
   the unit itself calls critical still gets through: quiet hours mute noise,
   not emergencies. */
function inQuietHours(now = new Date()) {
  const q = getPrefs().quietHours;
  if (!q.on) return false;
  const h = now.getHours();
  return q.from > q.to ? (h >= q.from || h < q.to) : (h >= q.from && h < q.to);
}

export function shouldNotify(alert) {
  const prefs = getPrefs();
  if (!prefs.enabled) return false;
  if (permission() !== 'granted') return false;

  const level = alert.type === 'danger' || alert.type === 'critical' ? 'action'
              : alert.type === 'warning' ? 'action'
              : 'info';

  if (!prefs.levels[level]) return false;
  if (inQuietHours() && level !== 'action') return false;
  return true;
}

/* --------------------------------------------------------------- dedupe */
/* The hardware service re-renders on every tick. Without this, one alert
   would fire a notification several times a second. */

function seen() {
  try { return JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]'); }
  catch { return []; }
}

function remember(id) {
  const list = seen();
  list.push(id);
  try { sessionStorage.setItem(SEEN_KEY, JSON.stringify(list.slice(-60))); } catch {}
}

export function isNew(alert) {
  const id = alert.id || (alert.title + '|' + alert.timestamp);
  if (seen().includes(id)) return false;
  remember(id);
  return true;
}

/* ---------------------------------------------------------------- badge */

export function setBadge(count) {
  try {
    if (!('setAppBadge' in navigator)) return;
    if (count > 0) navigator.setAppBadge(count);
    else navigator.clearAppBadge();
  } catch {}
}

/* ------------------------------------------------------- push plumbing */

function urlBase64ToUint8Array(base64) {
  const padded = (base64 + '='.repeat((4 - base64.length % 4) % 4))
    .replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function serverKey() {
  const res = await fetch('/api/vapid-public-key');
  if (!res.ok) throw new Error('no push server');
  const { publicKey } = await res.json();
  return publicKey;
}

/* Enable must be called from a real click. Browsers reject a permission
   prompt that did not come from a user gesture, silently on some versions. */
export async function enable({ lang = 'en', unit = 'NM-004' } = {}) {
  if (!isSupported()) return { ok: false, reason: 'unsupported' };

  const granted = await Notification.requestPermission();
  if (granted !== 'granted') return { ok: false, reason: granted };

  const reg = await navigator.serviceWorker.ready;
  const prefs = setPrefs({ enabled: true });

  // The local path works from here on, with or without a server.
  let push = 'local-only';
  try {
    const key = await serverKey();
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key)
    });
    const levels = Object.entries(prefs.levels)
      .filter(([, on]) => on).map(([k]) => k);

    const res = await apiFetch('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        subscription: sub, lang, unit, levels,
        quietFrom: prefs.quietHours.from,
        quietTo: prefs.quietHours.to
      })
    });
    push = res.ok ? 'subscribed' : 'local-only';
  } catch {
    // No relay reachable. Local notifications still work, so this is a
    // degraded state rather than a failure.
    push = 'local-only';
  }

  return { ok: true, push };
}

export async function disable() {
  setPrefs({ enabled: false });
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await apiFetch('/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ endpoint: sub.endpoint })
      }).catch(() => {});
      await sub.unsubscribe();
    }
  } catch {}
  setBadge(0);
  return { ok: true };
}

export async function pushState() {
  if (!isSupported()) return 'unsupported';
  if (Notification.permission !== 'granted') return Notification.permission;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return sub ? 'subscribed' : 'local-only';
  } catch {
    return 'local-only';
  }
}

/* ----------------------------------------------------------- delivering */

export async function notify(alert) {
  if (!shouldNotify(alert) || !isNew(alert)) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(alert.title || 'NAVONMESH', {
      body: alert.message || '',
      tag: alert.id || 'navonmesh',
      renotify: false,
      requireInteraction: alert.type === 'danger' || alert.type === 'critical',
      data: { tab: 'alerts', id: alert.id },
      icon: './icon-192.png',
      badge: './icon-badge.png'
    });
    return true;
  } catch {
    return false;
  }
}

/* Called on every hardware tick. Fires at most one notification per new
   alert and keeps the app badge in step with what needs action. */
export function syncFromState(state) {
  const alerts = state.alerts || [];
  const needsAction = alerts.filter(
    a => a.type === 'danger' || a.type === 'critical' || a.type === 'warning'
  );
  setBadge(getPrefs().enabled ? needsAction.length : 0);
  for (const a of alerts) notify(a);
}

/* A real notification the farmer can see, so the setting proves itself the
   moment it is switched on. */
export async function sendTest() {
  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification('NAVONMESH is set up', {
    body: 'This is how an alert will look. Your cold storage will reach you here.',
    tag: 'navonmesh-test',
    data: { tab: 'alerts' },
    icon: './icon-192.png'
  });
}
