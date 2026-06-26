/* ============================================
   RW PORTFOLIO — SERVICE WORKER v2
   Cache-first with network fallback
   ============================================ */

const CACHE = 'rw-v3';
const PRECACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/main.js',
  '/manifest.json',
  '/icons/favicon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// Install — cache essential assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate — delete old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — cache-first, network fallback
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // Skip cross-origin CDN requests from cache strategy
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;

      return fetch(e.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        return response;
      });
    }).catch(() => {
      // Offline fallback
      if (e.request.destination === 'document') {
        return caches.match('/index.html');
      }
    })
  );
});
