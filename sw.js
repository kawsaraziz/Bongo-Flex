/* ================================================
   Bongo Flex — Service Worker
   ================================================ */
const CACHE_NAME = 'bongo-flex-v1';
const CACHE_URLS = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/* ---- Install: pre-cache shell ---- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_URLS).catch(() => {
        // Silently fail if some assets unavailable
      });
    })
  );
  self.skipWaiting();
});

/* ---- Activate: clean old caches ---- */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ---- Fetch: Network-first for streams, Cache-first for shell ---- */
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Always network-first for live stream URLs (m3u8, ts)
  if (
    url.includes('.m3u8') ||
    url.includes('.ts') ||
    url.includes('playlist') ||
    url.includes('aynaott') ||
    url.includes('gpcdn') ||
    url.includes('akash-go') ||
    url.includes('pishow')
  ) {
    event.respondWith(fetch(event.request).catch(() => new Response('', {status: 503})));
    return;
  }

  // Cache-first for app shell (HTML, icons, manifest)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
