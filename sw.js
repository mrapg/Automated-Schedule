/* sw.js - Consolidated Offline Cache + Firebase Messaging */

// 1. IMPORT FIREBASE COMPAT SCRIPTS (Required for Service Workers)
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// 2. INITIALIZE FIREBASE (Must use your project config)
firebase.initializeApp({
    apiKey: "AIzaSyDOyTh56Wt3AtsG05nc04LsE1k3YxbuEdE",
    authDomain: "schedule-debeb.firebaseapp.com",
    projectId: "schedule-debeb",
    storageBucket: "schedule-debeb.firebasestorage.app",
    messagingSenderId: "139527638715",
    appId: "1:139527638715:web:cfce01b41f323fd113239e"
});

const messaging = firebase.messaging();

// 3. CACHING CONFIGURATION
const CACHE_NAME = 'afmc-schedule-v22'; // Incremented version to refresh cache
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

// 4. INSTALL & ACTIVATE (Your existing logic)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
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

// 5. FETCH (Your existing Network-first for HTML logic)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate' || event.request.url.endsWith('index.html') || event.request.url.endsWith('/')) {
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
        if (!response || response.status !== 200) return response;
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        return response;
      });
    })
  );
});

// 6. PUSH NOTIFICATIONS (Consolidated handler)
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received', payload);
    const { title, body } = payload.notification;
    const { type, eventDate, eventId } = payload.data;

    let targetUrl = './index.html';
    if (type === 'venue_change' || type === 'faculty_change') {
        targetUrl = `./index.html?date=${eventDate || ''}&eventId=${eventId || ''}`;
    }

    const options = {
        body: body || 'Your schedule has been updated.',
        icon: './icon-192.png',
        badge: './icon-192.png',
        tag: type || 'schedule-update',
        renotify: true,
        vibrate: [200, 100, 200],
        data: { targetUrl, type, eventDate, eventId }
    };

    return self.registration.showNotification(title || 'AFMC Schedule', options);
});

// 7. NOTIFICATION CLICK HANDLING
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.targetUrl || './index.html';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('index.html') || client.url.endsWith('/')) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            targetUrl,
            notifType: event.notification.data?.type,
            eventDate: event.notification.data?.eventDate,
            eventId: event.notification.data?.eventId,
          });
          return;
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

// Add this to sw.js
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Background message received:', payload);
  const { title, body } = payload.notification;
  
  const notificationOptions = {
    body: body,
    icon: '/icon-192.png', // Ensure this path is correct in your public folder
    badge: '/icon-192.png',
    data: payload.data // Pass data for click actions
  };

  return self.registration.showNotification(title, notificationOptions);
});
