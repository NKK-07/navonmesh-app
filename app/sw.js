// NAVONMESH PWA Service Worker for Offline First Operation
//
// Scope is /app/, so this worker only ever controls the PWA — never the
// marketing site at the origin root.
//
// Strategy: network-first for navigations so a deploy is picked up on the
// next visit, cache-first for static assets so the app still opens with no
// signal. CACHE_NAME carries a version: bump it whenever ASSETS changes, and
// the old cache is dropped on activate.

const CACHE_NAME = 'navonmesh-v6';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/css/style.css',
  './src/app.js',
  './src/data/crops.js',
  './src/data/i18n.js',
  './src/data/mockHardware.js',
  './src/utils/audio.js'
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
