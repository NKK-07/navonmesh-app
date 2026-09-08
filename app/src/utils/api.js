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

/* Where the session lives is a decision the farmer makes at sign in.
 *
 * The default is sessionStorage, which dies when the tab closes. Before this,
 * a 30 day token went into localStorage unconditionally: sign in once on the
 * phone at an FPO collection centre and you stayed signed in for a month, on a
 * device the next person picks up. That is the wrong default for a device
 * several people share.
 *
 * localStorage is still available and still the right answer for a farmer's
 * own phone, but only when they tick the box asking for it. */
function stores() {
  const out = [];
  try { out.push(sessionStorage); } catch {}
  try { out.push(localStorage); } catch {}
  return out;
}

function read(key) {
  for (const s of stores()) {
    try { const v = s.getItem(key); if (v !== null) return v; } catch {}
  }
  return null;
}

export function getToken() {
  return read(TOKEN_KEY);
}

export function getUser() {
  try { return JSON.parse(read(USER_KEY) || 'null'); }
  catch { return null; }
}

export function isSignedIn() {
  return !!getToken();
}

/** True when this session was deliberately persisted past the tab closing. */
export function isRemembered() {
  try { return localStorage.getItem(TOKEN_KEY) !== null; } catch { return false; }
}

function store(token, user, remember) {
  /* Written to exactly one place. Writing both would make "keep me signed in"
     impossible to turn off: clearing the session copy would leave the durable
     one behind and silently sign the next person in. */
  const target = remember ? 'localStorage' : 'sessionStorage';
  try {
    window[target].setItem(TOKEN_KEY, token);
    window[target].setItem(USER_KEY, JSON.stringify(user));
  } catch {}
  /* and never in the other one */
  const other = remember ? 'sessionStorage' : 'localStorage';
  try {
    window[other].removeItem(TOKEN_KEY);
    window[other].removeItem(USER_KEY);
  } catch {}
}

export function signOut() {
  for (const s of stores()) {
    try { s.removeItem(TOKEN_KEY); s.removeItem(USER_KEY); } catch {}
  }
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

/* A phone number is one number however it is typed. Farmers write it with
 * spaces, with 0 in front, with 91, or with none of those, and before this any
 * of them came back as "that phone number and PIN do not match" — blaming the
 * credentials for a formatting difference nobody can see, three tries from a
 * 15 minute lockout. Normalising here rather than server side keeps the stored
 * identity exactly one canonical string. */
export function normalisePhone(input) {
  let s = String(input || '').replace(/[\s()\-.]/g, '');
  if (!s) return s;
  if (s.startsWith('+')) return s;
  s = s.replace(/^00/, '');           // 0091...
  if (s.startsWith('91') && s.length === 12) return '+' + s;
  s = s.replace(/^0/, '');            // domestic trunk prefix
  if (s.length === 10) return '+91' + s;
  return '+' + s;
}

export async function login(phone, pin, remember = false) {
  const res = await fetch(API_BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ phone: normalisePhone(phone), pin })
  });

  if (res.status === 423) {
    const b = await res.json().catch(() => ({}));
    return { ok: false, reason: 'locked', until: b.until };
  }
  if (res.status === 429) return { ok: false, reason: 'rate' };

  /* Only a 401 means the phone and PIN were wrong. Everything else is our
     problem, not the farmer's, and must not be reported as a bad credential:
     someone standing at a cold store being told their PIN is wrong will retype
     it until the account locks, and will not think to mention the outage. A
     404 from a routing mistake read exactly like a wrong PIN once already. */
  if (res.status === 401) return { ok: false, reason: 'invalid' };
  if (!res.ok) return { ok: false, reason: 'server', status: res.status };

  const body = await res.json().catch(() => null);
  if (!body || !body.token) return { ok: false, reason: 'server', status: res.status };

  store(body.token, body.user, remember);
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
