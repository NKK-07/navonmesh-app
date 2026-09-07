/* NAVONMESH — service worker kill switch (site root).
 *
 * The PWA used to live at this origin's root and registered a cache-first
 * service worker here. Because its CACHE_NAME never changed, every browser
 * that ever opened the old build stayed pinned to it: `caches.match()` won
 * on every request, so new deploys were invisible.
 *
 * The PWA now lives under /app/ and registers its worker at /app/sw.js,
 * scoped to /app/. This file replaces the old root worker: it takes over,
 * deletes every cache, unregisters itself, and reloads any open tab so the
 * visitor lands on the current site. It has no fetch handler, so while it
 * is alive every request goes straight to the network.
 *
 * Keep this file here. Deleting it would leave the old worker in place on
 * any browser that has not yet updated.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));

    await self.registration.unregister();

    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.navigate(client.url);
    }
  })());
});
