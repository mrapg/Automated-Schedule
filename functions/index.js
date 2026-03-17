/**
 * Firebase Cloud Function — FCM Notification Sender
 * 
 * Watches the notification_queue collection in Firestore.
 * When admin writes a notification request doc, this function:
 *   1. Reads all subscriber tokens from push_tokens collection
 *   2. Sends via FCM HTTP v1 API (authenticated with service account)
 *   3. Cleans up invalid tokens
 *   4. Deletes the queue doc when done
 * 
 * Deploy with:
 *   firebase deploy --only functions
 */

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp }     = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging }      = require('firebase-admin/messaging');

initializeApp();

const APP_ID = 'schedule-debeb';
const BASE   = `artifacts/${APP_ID}/public/data`;

exports.sendScheduleNotification = onDocumentCreated(
    `${BASE}/notification_queue/{docId}`,
    async (event) => {
        const db   = getFirestore();
        const snap = event.data;
        if (!snap) return;

        const { title, body, type, eventDate, eventId } = snap.data();

        // Mark as processing immediately to prevent duplicate runs
        await snap.ref.update({ status: 'processing' });

        try {
            // Fetch all subscriber tokens
            const tokenSnap = await db.collection(`${BASE}/push_tokens`).get();
            const tokenDocs  = tokenSnap.docs;
            const tokens     = tokenDocs.map(d => d.data().token).filter(Boolean);

            if (tokens.length === 0) {
                console.log('No subscribers — nothing to send.');
                await snap.ref.delete();
                return;
            }

            console.log(`Sending "${title}" to ${tokens.length} subscribers`);

            // FCM HTTP v1 multicast — max 500 tokens per call
            const messaging = getMessaging();
            const BATCH      = 500;
            let   sent       = 0;
            const invalidTokens = [];

            for (let i = 0; i < tokens.length; i += BATCH) {
                const batchTokens = tokens.slice(i, i + BATCH);
                // functions/index.js - Update the message object
                const message = {
                    tokens: batchTokens,
                    notification: { title, body },
                    // Android high priority
                    android: {
                        priority: 'high'
                    },
                    webpush: {
                        headers: {
                            // iOS/Web high priority
                            Urgency: 'high'
                        },
                        notification: {
                            title,
                            body,
                            icon: '/icon-192.png',
                            badge: '/icon-192.png',
                            vibrate: [200, 100, 200]
                        },
                        fcmOptions: { link: buildDeepLink(type, eventDate, eventId) }
                    },
                    data: {
                        type: type || 'general',
                        eventDate: eventDate || '',
                        eventId: eventId || ''
                    }
                };

                const response = await messaging.sendEachForMulticast(message);
                sent += response.successCount;

                // Collect invalid/expired tokens for cleanup
                response.responses.forEach((res, idx) => {
                    if (!res.success) {
                        const code = res.error?.code || '';
                        if (code.includes('registration-token-not-registered') ||
                            code.includes('invalid-registration-token')) {
                            invalidTokens.push(batchTokens[idx]);
                        }
                    }
                });
            }

            console.log(`Sent: ${sent}, Failed: ${tokens.length - sent}, Invalid tokens: ${invalidTokens.length}`);

            // Clean up invalid tokens in batches
            if (invalidTokens.length > 0) {
                const batch = db.batch();
                tokenDocs.forEach(d => {
                    if (invalidTokens.includes(d.data().token)) batch.delete(d.ref);
                });
                await batch.commit();
                console.log(`Removed ${invalidTokens.length} invalid tokens`);
            }

            // Mark done and delete queue doc
            await snap.ref.update({ status: 'sent', sentCount: sent, sentAt: new Date().toISOString() });
            // Optionally keep for 1 hour then delete — or delete immediately:
            await snap.ref.delete();

        } catch (err) {
            console.error('sendScheduleNotification error:', err);
            await snap.ref.update({ status: 'error', error: err.message });
        }
    }
);

function buildDeepLink(type, eventDate, eventId) {
    // Base URL of your GitHub Pages app
    const BASE_URL = 'https://mrapg.github.io/Automated-Schedule/index.html';
    if ((type === 'venue_change' || type === 'faculty_change') && eventDate) {
        return `${BASE_URL}?date=${eventDate}&eventId=${eventId || ''}`;
    }
    return BASE_URL;
}
