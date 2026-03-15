const CACHE_NAME = 'afmc-schedule-v13'; // Bumped — forces old cache purge on update
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './utils.js',
  'https://cdn.tailwindcss.com', 
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'
];

// 1. Install: Cache the Application Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell v13');
      return cache.addAll(ASSETS);
    })
  );
  // Take over immediately without waiting for old SW to idle
  self.skipWaiting();
});

// 2. Activate: Purge ALL old caches, then claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      // Claim all open tabs/windows immediately so they use the new SW
      // This is what makes installed PWA users get the update without manual refresh
      return self.clients.claim();
    }).then(() => {
      // Tell all clients to reload so they pick up the new index.html
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_UPDATED' });
        });
      });
    })
  );
});

// 3. Fetch: Network-first for HTML, Cache-first for everything else
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Network-first for HTML navigation requests
  // This ensures installed PWA users always get fresh HTML when online
  if (event.request.mode === 'navigate' || 
      event.request.url.endsWith('index.html') || 
      event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh HTML for offline use
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback — serve cached HTML
          return caches.match('./index.html');
        })
    );
    return;
  }

  // Cache-first for all other assets (JS, CSS, fonts, images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || 
            (response.type !== 'basic' && response.type !== 'cors')) {
          return response;
        }
        // Dynamically cache new assets
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});
