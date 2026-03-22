/* sw.js - Consolidated Offline Cache + Firebase Messaging */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getMessaging, onBackgroundMessage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-sw.js";

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

const CACHE_NAME = 'afmc-schedule-v26';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './utils.js'
];

// ── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── ACTIVATE ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.map((key) => { if (key !== CACHE_NAME) return caches.delete(key); })
      ))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' })
        .then(clients => clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' })))
      )
  );
});

// ── FETCH ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate' ||
      event.request.url.endsWith('index.html') ||
      event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
        return response;
      });
    })
  );
});

// ── BACKGROUND PUSH MESSAGES ──────────────────────────────────────────────────
onBackgroundMessage(messaging, (payload) => {
  console.log('[SW] Background message received', payload);

  const title = payload.notification?.title || 'AFMC Schedule';
  const body  = payload.notification?.body  || 'Your schedule has been updated.';
  const { type, eventDate, eventId } = payload.data || {};

  let targetUrl = './index.html';
  if ((type === 'venue_change' || type === 'faculty_change') && eventDate) {
    targetUrl = `./index.html?date=${eventDate}&eventId=${eventId || ''}`;
  }

  return self.registration.showNotification(title, {
    body,
    icon:     './icon-192.png',
    badge:    './icon-192.png',
    tag:      type || 'schedule-update',
    renotify: true,
    vibrate:  [200, 100, 200],
    data:     { targetUrl, type, eventDate, eventId }
  });
});

// ── NOTIFICATION CLICK ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.targetUrl || './index.html';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('index.html') || client.url.endsWith('/')) {
          client.focus();
          client.postMessage({
            type:      'NOTIFICATION_CLICK',
            targetUrl,
            notifType: event.notification.data?.type,
            eventDate: event.notification.data?.eventDate,
            eventId:   event.notification.data?.eventId,
          });
          return;
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
