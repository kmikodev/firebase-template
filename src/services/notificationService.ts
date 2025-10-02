/**
 * Notification Service - FCM Token Management
 *
 * Handles:
 * - Requesting notification permissions
 * - Registering FCM tokens
 * - Syncing tokens with Firestore
 * - Handling foreground notifications
 */

import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// IMPORTANT: Get this from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
// To get your VAPID key:
// 1. Go to https://console.firebase.google.com/project/comprakitsupervivencia/settings/cloudmessaging
// 2. Scroll to "Web configuration" > "Web Push certificates"
// 3. If no key exists, click "Generate key pair"
// 4. Copy the "Key pair" value and paste it below
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'REPLACE_WITH_YOUR_VAPID_KEY';

let messaging: Messaging | null = null;

// Initialize messaging (only in supported browsers)
export function initializeMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;

  try {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      messaging = getMessaging();
      return messaging;
    }
  } catch (error) {
    console.error('Error initializing messaging:', error);
  }

  return null;
}

/**
 * Check if browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    throw new Error('Notifications not supported in this browser');
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    throw error;
  }
}

/**
 * Register service worker for background notifications
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers not supported');
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Error registering service worker:', error);
    throw error;
  }
}

/**
 * Get FCM token for this device
 */
export async function getFCMToken(userId: string): Promise<string | null> {
  if (!messaging) {
    messaging = initializeMessaging();
  }

  if (!messaging) {
    console.warn('Messaging not supported');
    return null;
  }

  try {
    // Ensure service worker is registered
    await registerServiceWorker();

    // Request permission if needed
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready
    });

    if (token) {
      console.log('FCM token obtained:', token);

      // Save token to Firestore
      await saveFCMToken(userId, token);

      return token;
    } else {
      console.log('No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    throw error;
  }
}

/**
 * Save FCM token to Firestore
 */
async function saveFCMToken(userId: string, token: string): Promise<void> {
  try {
    const tokenRef = doc(collection(db, 'users', userId, 'fcmTokens'), token);

    await setDoc(tokenRef, {
      token,
      device: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      },
      createdAt: new Date(),
      lastUsedAt: new Date(),
    });

    console.log('FCM token saved to Firestore');
  } catch (error) {
    console.error('Error saving FCM token:', error);
    throw error;
  }
}

/**
 * Delete FCM token from Firestore (on logout)
 */
export async function deleteFCMToken(userId: string, token: string): Promise<void> {
  try {
    const tokenRef = doc(collection(db, 'users', userId, 'fcmTokens'), token);
    await deleteDoc(tokenRef);
    console.log('FCM token deleted from Firestore');
  } catch (error) {
    console.error('Error deleting FCM token:', error);
    throw error;
  }
}

/**
 * Setup foreground notification handler
 *
 * @param onNotification - Callback when notification received while app is open
 */
export function onForegroundMessage(
  onNotification: (payload: any) => void
): (() => void) | null {
  if (!messaging) {
    messaging = initializeMessaging();
  }

  if (!messaging) return null;

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);

      // Show browser notification
      if (Notification.permission === 'granted') {
        const notificationTitle = payload.notification?.title || 'Nueva Notificación';
        const notificationOptions = {
          body: payload.notification?.body || '',
          icon: '/logo.png',
          tag: payload.data?.type || 'default',
          data: payload.data,
        };

        new Notification(notificationTitle, notificationOptions);
      }

      // Call custom handler
      onNotification(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up foreground message handler:', error);
    return null;
  }
}

/**
 * Subscribe to notification topic (for broadcast messages)
 * Note: Topic subscription must be done server-side via Cloud Functions
 */
export async function subscribeToTopic(_userId: string, topic: string): Promise<void> {
  console.log(`Topic subscription (${topic}) must be done server-side`);
  // This is typically done in a Cloud Function when user preferences change
}
