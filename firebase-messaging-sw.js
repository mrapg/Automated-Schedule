// firebase-messaging-sw.js
// Required by Firebase Cloud Messaging for background push notifications.
// Must be in the root of your site.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey:            "AIzaSyDOyTh56Wt3AtsG05nc04LsE1k3YxbuEdE",
    authDomain:        "schedule-debeb.firebaseapp.com",
    projectId:         "schedule-debeb",
    storageBucket:     "schedule-debeb.firebasestorage.app",
    messagingSenderId: "139527638715",
    appId:             "1:139527638715:web:cfce01b41f323fd113239e",
    measurementId:     "G-KB7RQN5DD4"
});

const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification || {};
    const { type, eventDate, eventId } = payload.data || {};

    let url = '/index.html';
    if ((type === 'venue_change' || type === 'faculty_change') && eventDate) {
        url = `/index.html?date=${eventDate}&eventId=${eventId || ''}`;
    }

    self.registration.showNotification(title || 'AFMC Schedule', {
        body:    body || 'Your schedule has been updated.',
        icon:    '/icon-192.png',
        badge:   '/icon-192.png',
        vibrate: [200, 100, 200],
        data:    { url }
    });
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = (event.notification.data && event.notification.data.url) || '/index.html';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if (client.url.includes('index.html') && 'focus' in client) {
                    client.focus();
                    client.postMessage({ type: 'NOTIFICATION_CLICK', targetUrl: url });
                    return;
                }
            }
            return clients.openWindow(url);
        })
    );
});
