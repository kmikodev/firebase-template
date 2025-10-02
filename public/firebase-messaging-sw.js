/**
 * Firebase Cloud Messaging Service Worker
 *
 * Handles background notifications when the app is not in focus
 */

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Your Firebase config - Loaded from environment
// These values match the main app configuration in src/lib/firebase.ts
firebase.initializeApp({
  apiKey: "AIzaSyAz3jmKK1JRT3Fmk1U1PDOkbfhVen0sPvo",
  authDomain: "comprakitsupervivencia.firebaseapp.com",
  projectId: "comprakitsupervivencia",
  storageBucket: "comprakitsupervivencia.firebasestorage.app",
  messagingSenderId: "887064652263",
  appId: "1:887064652263:web:1d49a924ccc642306c3542",
  measurementId: "G-57GL35JSNM"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);

  const notificationTitle = payload.notification?.title || 'Nueva Notificación';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo.png',
    badge: '/badge.png',
    tag: payload.data?.type || 'default',
    data: payload.data,
    requireInteraction: true, // Keep notification visible until user interacts
    actions: [
      {
        action: 'open',
        title: 'Ver'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          const data = event.notification.data;
          let url = '/';

          // Navigate to relevant page based on notification type
          if (data?.type === 'ticket_confirmed' || data?.type === 'your_turn') {
            url = '/client-queue';
          }

          return clients.openWindow(url);
        }
      })
  );
});
