/* sw.js - Consolidated Offline Cache + Firebase Messaging */

// 1. Import Modular SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getMessaging, onBackgroundMessage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-sw.js";

// 2. Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDOyTh56Wt3AtsG05nc04LsE1k3YxbuEdE",
    authDomain: "schedule-debeb.firebaseapp.com",
    projectId: "schedule-debeb",
    storageBucket: "schedule-debeb.firebasestorage.app",
    messagingSenderId: "139527638715",
    appId: "1:139527638715:web:cfce01b41f323fd113239e"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// --- ADDED: DEFINE YOUR CACHE VARIABLES ---
// If these are not defined, the script crashes immediately!
const CACHE_NAME = 'afmc-schedule-v25'; 
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './utils.js'
];

// 3. Handle background messages
onBackgroundMessage(messaging, (payload) => {
  console.log('[sw.js] Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || "New Update";
  const notificationOptions = {
    body: payload.notification?.body || "Check the schedule for changes.",
    // NOTE: Use relative paths (./) to ensure they work on GitHub Pages
    icon: './icon-192.png', 
    badge: './icon-192.png',
    data: payload.data 
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 4. INSTALL & ACTIVATE
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
// --- PART A: The Receiver ---
onBackgroundMessage(messaging, (payload) => {
    console.log('[SW] Background message received', payload);
    
    // Safety check for payload data
    const title = payload.notification?.title || 'AFMC Schedule';
    const body  = payload.notification?.body  || 'Your schedule has been updated.';
    const { type, eventDate, eventId } = payload.data || {};

    // Logic for deep-linking
    let targetUrl = './index.html';
    if ((type === 'venue_change' || type === 'faculty_change') && eventDate) {
        targetUrl = `./index.html?date=${eventDate}&eventId=${eventId || ''}`;
    }

    const options = {
        body: body,
        icon: './icon-192.png',
        badge: './icon-192.png',
        tag: type || 'schedule-update',
        renotify: true,
        vibrate: [200, 100, 200],
        // CRITICAL: Pass the targetUrl into the notification data
        data: { targetUrl } 
    };

    return self.registration.showNotification(title, options);
});

// --- PART B: The Click Handler (ADD THIS EXACTLY) ---
self.addEventListener('notificationclick', (event) => {
    // 1. Close the notification popup
    event.notification.close();

    // 2. Extract the URL we saved in Part A
    const urlToOpen = event.notification.data?.targetUrl || './index.html';

    // 3. Open the window or focus an existing one
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if app is already open
            for (let client of windowClients) {
                if ('focus' in client) {
                    return client.focus().then(() => client.navigate(urlToOpen));
                }
            }
            // If not open, open new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
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
