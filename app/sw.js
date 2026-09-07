// NAVONMESH PWA Service Worker for Offline First Operation
//
// Scope is /app/, so this worker only ever controls the PWA — never the
// marketing site at the origin root.
//
// Strategy: network-first for navigations so a deploy is picked up on the
// next visit, cache-first for static assets so the app still opens with no
// signal. CACHE_NAME carries a version: bump it whenever ASSETS changes, and
// the old cache is dropped on activate.

const CACHE_NAME = 'navonmesh-v9';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/css/style.css',
  './src/app.js',
  './src/data/crops.js',
  './src/data/i18n.js',
  './src/data/mockHardware.js',
  './src/utils/audio.js',
  './src/utils/notifications.js',
  './src/utils/api.js',
  './src/views/LoginPage.js',
  './icon-192.png',
  './icon-badge.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => (key === CACHE_NAME ? null : caches.delete(key)))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') return;

  // Navigations: try the network first so a new deploy wins, fall back to
  // the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Static assets: cache first, then refresh the entry in the background.
  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});


/* ==========================================================================
   Push
   The relay signs a payload with its VAPID key and the push service wakes
   this worker, even with the app closed. That is the whole point of the
   server: everything else the app can do by itself.
   ========================================================================== */

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }

  const critical = data.level === 'action';
  const title = data.title || 'NAVONMESH';
  const body = data.action ? (data.body + ' ' + data.action) : (data.body || '');

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      tag: data.id || 'navonmesh-push',
      renotify: false,
      requireInteraction: critical,
      data: { tab: 'alerts', id: data.id },
      icon: './icon-192.png',
      badge: './icon-badge.png'
    }).then(() => {
      if ('setAppBadge' in self.navigator && critical) {
        return self.navigator.setAppBadge(1).catch(() => {});
      }
    })
  );
});

/* Tapping the notification should land on the alert, not on a cold start of
   the dashboard. Focus an open tab if there is one, otherwise open a new one
   already pointed at the Alerts tab. */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = './?tab=alerts';

  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });
    for (const client of clients) {
      if (client.url.includes('/app/') && 'focus' in client) {
        client.postMessage({ type: 'open-tab', tab: 'alerts' });
        return client.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(target);
  })());
});

self.addEventListener('notificationclose', () => {
  if ('clearAppBadge' in self.navigator) {
    self.navigator.clearAppBadge().catch(() => {});
  }
});
