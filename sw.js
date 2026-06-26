/* ============================================
   RW PORTFOLIO — SERVICE WORKER v5
   Cache-first with network fallback
   Update notification support
   Performance optimized
   ============================================ */

const CACHE = 'rw-v5';
const PRECACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/main.js',
  '/manifest.json',
  '/icons/favicon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/og-image.svg',
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

// Fetch — optimized cache strategy
self.addEventListener('fetch', (e) => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Skip non-local requests
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      // Return cached version if available (cache-first for static)
      if (cached) return cached;

      // Otherwise fetch from network
      return fetch(e.request).then((response) => {
        // Don't cache bad responses
        if (!response || response.status !== 200) {
          return response;
        }

        // Cache successful responses (except for HTML to ensure freshness)
        if (!url.pathname.endsWith('.html')) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => {
            cache.put(e.request, clone);
          });
        }

        return response;
      }).catch(() => {
        // Offline fallback
        if (url.pathname === '/' || url.pathname.endsWith('.html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Handle skipWaiting message for PWA updates
self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
