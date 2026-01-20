/**
 * sw.js - Service Worker v5
 * Optimized for AFMC Training Schedule Offline Access
 * * Strategy:
 * 1. Pre-cache essential core assets on install.
 * 2. Stale-While-Revalidate for HTML/Logic (fast loading + background updates).
 * 3. Cache-First for static assets and heavy external libraries.
 */

const CACHE_NAME = 'afmc-schedule-v5';

// Core assets to cache for immediate offline availability
const PRECACHE_ASSETS = [
  './',
  'index.html',
  'admin.html',
  'utils.js',
  'manifest.json',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png',
  // External CDNs - Cached once and kept to avoid re-downloading on slow networks
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'
];

// Installation: Open cache and store the core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching core assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation: Clean up any old caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetching: Handle network requests based on type
self.addEventListener('fetch', (event) => {
  // We only cache GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Strategy A: Stale-While-Revalidate for HTML and local JS
  // This serves the cached version instantly but fetches the latest version in the background.
  if (url.origin === location.origin && (url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js'))) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchedResponse = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // If network fails, the cachedResponse will be used (already handled by return response || fetchedResponse)
          });

          return cachedResponse || fetchedResponse;
        });
      })
    );
    return;
  }

  // Strategy B: Cache-First for static assets (Icons, Fonts, and CDN Libraries)
  // These rarely change, so we serve from cache first to save data and speed up loading.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // If we get a valid response, add it to the cache for next time
        if (networkResponse && networkResponse.status === 200) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for when both cache and network fail (e.g., specific image missing)
        return new Response('Offline content unavailable', { status: 404 });
      });
    })
  );
});
