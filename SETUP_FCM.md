# Firebase Cloud Messaging (FCM) Setup Guide

This guide explains how to complete the FCM push notifications setup for this app.

## ✅ What's Already Done

1. ✅ FCM service worker (`public/firebase-messaging-sw.js`)
2. ✅ Notification service (`src/services/notificationService.ts`)
3. ✅ FCM integration in AuthContext (auto-registers tokens on login)
4. ✅ Notification permission banner component
5. ✅ Notification history UI component
6. ✅ Backend Cloud Functions with notification triggers
7. ✅ Firestore collections for notifications and FCM tokens

## 🔑 Required: Get Your VAPID Key

The **only** missing piece is the VAPID key (Web Push certificate). Follow these steps:

### Step 1: Get VAPID Key from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/comprakitsupervivencia/settings/cloudmessaging)

2. Navigate to: **Project Settings** → **Cloud Messaging** tab

3. Scroll down to **Web configuration** section

4. Look for **Web Push certificates**

5. If no key exists:
   - Click **"Generate key pair"**
   - A new VAPID key will be generated

6. **Copy the Key pair value** (starts with "B..." and is ~87 characters long)

### Step 2: Add VAPID Key to Environment Variables

Add the VAPID key to your `.env` file:

```bash
# Add this line to .env
VITE_FIREBASE_VAPID_KEY=BKx1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123
```

**Replace** `BKx1234567890...` with your actual VAPID key from Step 1.

### Step 3: Rebuild and Redeploy

```bash
# Install dependencies if needed
npm install

# Build the app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## 📱 How It Works

### User Flow:

1. **User logs in** → AuthContext automatically initializes FCM
2. **First visit** → NotificationPermissionBanner appears
3. **User clicks "Activar Notificaciones"** → Browser asks for permission
4. **Permission granted** → FCM token registered in Firestore (`users/{userId}/fcmTokens/`)
5. **Queue events** → Cloud Functions send notifications automatically
6. **User receives notifications** → Both background and foreground

### Notification Types:

- **ticket_confirmed** 🎫 - When user takes a ticket
- **your_turn** 🎉 - When barber calls the user
- **queue_warning** ⚠️ - Timer warnings (optional future feature)

### Backend Integration:

Notifications are sent from Cloud Functions in `functions/src/queue/triggers.ts`:

```typescript
// Example: onQueueCreate trigger
await sendNotificationToUser(ticket.userId, {
  title: '🎫 Turno Confirmado',
  body: `Tu turno es #${ticketNumber}. Posición ${position} en la cola.`,
  data: {
    type: 'ticket_confirmed',
    queueId,
    ticketNumber,
    position: String(position),
  },
});
```

## 🧪 Testing Notifications

### Test in Development:

```bash
# Start Firebase emulators
npm run firebase:emulators

# Start dev server
npm run dev

# Open http://localhost:5173
```

1. Log in with Google (not as guest - guests don't get notifications)
2. Click "Activar Notificaciones" in the banner
3. Grant browser permission
4. Go to **Cola Virtual** (Client Queue)
5. Select a branch and take a ticket
6. You should receive a confirmation notification

### Test Background Notifications:

1. Take a ticket
2. Minimize or switch to another tab
3. Have a barber call your ticket (or wait for timer events)
4. Notification should appear even when app is in background

### Test Foreground Notifications:

1. Take a ticket
2. Keep the app visible in current tab
3. Have a barber call your ticket
4. Browser notification should appear + entry in Notification History

## 🔧 Troubleshooting

### No VAPID key in console?

Run this command to check your project:
```bash
firebase apps:sdkconfig web --project comprakitsupervivencia
```

If FCM is not enabled, enable it in Firebase Console:
1. Go to **Build** → **Cloud Messaging**
2. Click **Get Started** if prompted

### Notifications not working?

Check browser console for errors:
- `getFCMToken` errors usually mean VAPID key is wrong
- `Permission denied` means user blocked notifications
- `Service worker registration failed` - check `public/firebase-messaging-sw.js` exists

Clear localStorage and try again:
```javascript
localStorage.removeItem('notification-banner-dismissed');
location.reload();
```

### Testing with multiple devices?

Each device gets its own FCM token stored in:
```
/users/{userId}/fcmTokens/{tokenId}
```

Tokens are automatically:
- Added on login (if permission granted)
- Removed on logout
- Cleaned up when invalid (by Cloud Functions)

## 📊 Monitoring

### View registered tokens:

```bash
# Using Firebase CLI
firebase firestore:collections users/{userId}/fcmTokens
```

Or check Firestore console:
```
/users/{userId}/fcmTokens/
```

### View notification history:

```
/notifications/
```

Filtered by `userId` and ordered by `createdAt desc`

## 🚀 Production Deployment

Once VAPID key is configured:

```bash
# Build frontend
npm run build

# Deploy everything
firebase deploy

# Or just hosting
firebase deploy --only hosting
```

## 📝 Environment Variables Summary

Required in `.env`:

```bash
# Firebase Config (already set)
VITE_FIREBASE_API_KEY=AIzaSyAz3jmKK1JRT3Fmk1U1PDOkbfhVen0sPvo
VITE_FIREBASE_AUTH_DOMAIN=comprakitsupervivencia.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=comprakitsupervivencia
VITE_FIREBASE_STORAGE_BUCKET=comprakitsupervivencia.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=887064652263
VITE_FIREBASE_APP_ID=1:887064652263:web:1d49a924ccc642306c3542

# FCM VAPID Key (TO ADD)
VITE_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

## ✅ Final Checklist

- [ ] Get VAPID key from Firebase Console
- [ ] Add `VITE_FIREBASE_VAPID_KEY` to `.env`
- [ ] Test locally: `npm run dev`
- [ ] Test notifications with real user flow
- [ ] Build: `npm run build`
- [ ] Deploy: `firebase deploy --only hosting`
- [ ] Test in production
- [ ] Verify notifications work on mobile browsers

---

**Everything else is ready!** Just add the VAPID key and you're done. 🎉
