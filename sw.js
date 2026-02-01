const CACHE_NAME = 'afmc-schedule-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  'https://cdn.tailwindcss.com', 
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

// Install Event: Cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS);
    })
  );
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch Event: Cache First, then Network
self.addEventListener('fetch', (event) => {
  // Handle navigation requests to ensure SPA works offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
