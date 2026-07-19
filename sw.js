// Piara Khata — Service Worker
// Har baar app update karein to CACHE_NAME ka version number badha dein (v1 -> v2 -> v3 ...)
// warna purana cached version hi users ko milta rahega.
const CACHE_NAME = 'piara-khata-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
  './icons/icon-maskable-512x512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32x32.png',
  './icons/favicon-16x16.png'
];

// INSTALL — core files ko cache mein daal do
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE — purani caches saaf karo
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// FETCH — cache-first, fail hone par network, network bhi fail ho to index.html dikhao (offline fallback)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Cache mil gaya — background mein network se bhi update kar lo (stale-while-revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
