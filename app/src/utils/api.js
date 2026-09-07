// Talking to the NAVONMESH API.
//
// The app is offline first, so this layer never assumes the network is there.
// Every call can fail, and the caller is expected to fall back to the cached
// hardware state rather than show an error. A farmer in a field with no signal
// should see their last known readings, not a broken screen.

const TOKEN_KEY = 'navonmesh_token';
const USER_KEY = 'navonmesh_user';

/* Same origin in production: the API serves the app. Override only if the two
   are ever split across hosts. */
export const API_BASE = '';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
  catch { return null; }
}

export function isSignedIn() {
  return !!getToken();
}

function store(token, user) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export function signOut() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

/**
 * Authenticated fetch. A 401 means the token expired or was revoked, so the
 * session is cleared and the caller is told to sign in again rather than
 * being left staring at stale data that will never refresh.
 */
export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.authorization = 'Bearer ' + token;
  if (options.body && !headers['content-type']) {
    headers['content-type'] = 'application/json';
  }

  const res = await fetch(API_BASE + path, { ...options, headers });

  if (res.status === 401 && token) {
    signOut();
    window.dispatchEvent(new CustomEvent('navonmesh:signed-out'));
    throw new Error('session expired');
  }
  return res;
}

export async function login(phone, pin) {
  const res = await fetch(API_BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ phone, pin })
  });

  if (res.status === 423) {
    const b = await res.json().catch(() => ({}));
    return { ok: false, reason: 'locked', until: b.until };
  }
  if (res.status === 429) return { ok: false, reason: 'rate' };
  if (!res.ok) return { ok: false, reason: 'invalid' };

  const body = await res.json();
  store(body.token, body.user);
  return { ok: true, user: body.user };
}

/* Reads. Each returns null on failure so a caller can fall back to cache. */

async function readJson(path) {
  try {
    const res = await apiFetch(path);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export const getUnits  = () => readJson('/api/units');
export const getAlerts = () => readJson('/api/alerts');
export const getBatches = () => readJson('/api/batches');
export const getMe = () => readJson('/api/me');

export async function ackAlert(id) {
  try {
    const res = await apiFetch('/api/alerts/' + encodeURIComponent(id) + '/ack',
                               { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}

/** True when the API answers at all. Used to decide online or offline copy. */
export async function reachable() {
  try {
    const res = await fetch(API_BASE + '/api/health', { cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}
