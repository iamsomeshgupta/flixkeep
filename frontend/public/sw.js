const CACHE_NAME = 'flixkeep-cache-v1';
const OFFLINE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Installation: Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('PWA Service Worker: Caching App Shell');
      return cache.addAll(OFFLINE_ASSETS);
    })
  );
});

// Activation: Clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('PWA Service Worker: Clearing obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Intercept requests: Serve cached content offline
self.addEventListener('fetch', (event) => {
  // Only cache local GET assets, avoid API routes
  if (event.request.method === 'GET' && !event.request.url.includes('/api/v1/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
  }
});
