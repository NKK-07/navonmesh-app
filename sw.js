// NAVONMESH PWA Service Worker for Offline First Operation

const CACHE_NAME = 'navonmesh-v1';
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
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).catch(() => {
        return caches.match('./index.html');
      });
    })
  );
});
