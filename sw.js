const CACHE_NAME = 'afmc-schedule-v15'; // Bumped for push notification support
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

// 1. Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell v14');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activate: purge old caches, claim clients, notify for reload
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
    }).then(() => self.clients.claim())
      .then(() => {
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
        });
      })
  );
});

// 3. Fetch: Network-first for HTML, Cache-first for assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate' ||
      event.request.url.endsWith('index.html') ||
      event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 ||
            (response.type !== 'basic' && response.type !== 'cors')) return response;
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        return response;
      });
    })
  );
});

// ─── PUSH NOTIFICATIONS ──────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: 'AFMC Schedule', body: event.data.text(), type: 'general' };
  }

  const { title, body, type, eventDate, eventId } = payload;

  // Build the URL to open when notification is clicked
  let targetUrl = './index.html';
  if (type === 'venue_change' || type === 'faculty_change') {
    // Deep link to specific date — index.html will scroll to it on load
    targetUrl = `./index.html?date=${eventDate || ''}&eventId=${eventId || ''}`;
  }

  const options = {
    body: body || 'Your schedule has been updated.',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: type || 'schedule-update',   // tag collapses duplicate notifications
    renotify: true,
    vibrate: [200, 100, 200],
    data: { targetUrl, type, eventDate, eventId },
    actions: [
      { action: 'open', title: 'View Schedule' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title || 'AFMC Schedule', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.targetUrl)
    ? event.notification.data.targetUrl
    : './index.html';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it and post a message to navigate
      for (const client of clientList) {
        if (client.url.includes('index.html') || client.url.endsWith('/')) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            targetUrl,
            notifType: event.notification.data.type,
            eventDate: event.notification.data.eventDate,
            eventId: event.notification.data.eventId,
          });
          return;
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(targetUrl);
    })
  );
});
