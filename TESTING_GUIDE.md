# 🧪 Complete Testing Guide - Queue System

Comprehensive guide for testing the entire queue management system.

---

## 📋 Table of Contents

1. [Quick Start Testing](#quick-start-testing)
2. [Test Scenarios by Role](#test-scenarios-by-role)
3. [Cloud Functions Testing](#cloud-functions-testing)
4. [Push Notifications Testing](#push-notifications-testing)
5. [Loyalty Points Testing](#loyalty-points-testing)
6. [Edge Cases & Error Handling](#edge-cases--error-handling)
7. [Performance Testing](#performance-testing)
8. [Security Testing](#security-testing)

---

## 🚀 Quick Start Testing

### Local Development Testing

```bash
# Terminal 1: Start emulators
npm run firebase:emulators

# Terminal 2: Start dev server
npm run dev

# Open browser
http://localhost:5173
```

### Production Testing

```bash
# Open production URL
https://comprakitsupervivencia.web.app
```

---

## 👥 Test Scenarios by Role

### 🎟️ **Client Testing**

#### **Scenario 1: Happy Path - Take Ticket and Complete**

**Steps:**
1. ✅ Login with Google (not as guest)
2. ✅ Click "Activar Notificaciones" banner → Grant permission
3. ✅ Navigate to "Mis Turnos"
4. ✅ Select a branch
5. ✅ Click "🎫 Sacar Turno"
6. ✅ Verify ticket appears with:
   - Ticket number (BRANCH-YYYYMMDD-###)
   - Position in queue
   - Status: "Esperando"
   - 10-minute timer countdown
   - Estimated wait time

**Expected Results:**
- ✅ Ticket created in Firestore (`/queues/`)
- ✅ Push notification: "🎫 Turno Confirmado"
- ✅ Notification appears in history
- ✅ Real-time position updates
- ✅ User points remain >= 0

**Actions to Test:**
7. ✅ Click "✓ Marcar Llegada a Sucursal"
8. ✅ Verify status changes to "En sucursal"
9. ✅ Verify timer stops
10. ✅ Wait for barber to call (or simulate)
11. ✅ Receive push notification: "🎉 ¡ES TU TURNO!"
12. ✅ Wait for service completion
13. ✅ Check profile → +1 point added

#### **Scenario 2: Cancel Ticket**

**Steps:**
1. ✅ Take a ticket (status: waiting)
2. ✅ Click "✕ Cancelar Turno"
3. ✅ Confirm dialog
4. ✅ Verify ticket disappears
5. ✅ Check profile → Points unchanged (no penalty for early cancel)

#### **Scenario 3: No-Show (Timer Expiry)**

**Steps:**
1. ✅ Take a ticket
2. ✅ DON'T mark arrival
3. ✅ Wait 10 minutes (or change Firestore timerExpiry manually)
4. ✅ Wait for scheduled function to run (every 1 min)
5. ✅ Verify status changes to "expired"
6. ✅ Check profile → -3 points penalty

#### **Scenario 4: Late Cancellation**

**Steps:**
1. ✅ Take a ticket
2. ✅ Mark arrival (status: arrived)
3. ✅ Cancel ticket
4. ✅ Check profile → -5 points penalty (late cancellation)

#### **Scenario 5: Negative Points Block**

**Steps:**
1. ✅ Accumulate negative points (multiple no-shows)
2. ✅ Try to take a new ticket
3. ✅ Verify error: "No puedes sacar turno con puntos negativos"

---

### 💈 **Barber Testing**

#### **Scenario 1: Call Next Client**

**Pre-requisite:** At least 1 ticket in queue (status: waiting or arrived)

**Steps:**
1. ✅ Login as barber
2. ✅ Navigate to "Mi Cola"
3. ✅ Select your branch
4. ✅ Verify statistics show correct counts
5. ✅ Verify "Siguiente Cliente" card shows next ticket
6. ✅ Click "📢 Llamar Cliente"
7. ✅ Verify ticket status changes to "notified"
8. ✅ Verify client receives push notification
9. ✅ Verify 5-minute grace timer starts

**Expected Results:**
- ✅ Ticket status: waiting → notified
- ✅ Push notification sent to client
- ✅ Timer updated to 5 minutes
- ✅ Real-time UI updates

#### **Scenario 2: Complete Service**

**Pre-requisite:** Ticket in status 'in_service' or 'arrived'

**Steps:**
1. ✅ Find ticket in table
2. ✅ Click "✓ Completar" button
3. ✅ Confirm dialog
4. ✅ Verify ticket status changes to "completed"
5. ✅ Verify ticket disappears from active queue
6. ✅ Check client profile → +1 point added
7. ✅ Verify loyaltyTransaction created

**Expected Results:**
- ✅ Ticket marked as completed
- ✅ Client earns +1 point
- ✅ Transaction record created
- ✅ Queue positions reordered

#### **Scenario 3: Cancel Ticket with Reason**

**Pre-requisite:** Any active ticket

**Steps:**
1. ✅ Find ticket in table
2. ✅ Click "✕ Cancelar" button
3. ✅ Enter reason in prompt (e.g., "Cliente no llegó")
4. ✅ Verify ticket status changes to "cancelled"
5. ✅ Verify reason saved in Firestore
6. ✅ Check if penalty applies (depends on status)

**Expected Results:**
- ✅ Ticket cancelled with reason
- ✅ Penalty applied if late cancellation
- ✅ Queue positions reordered

#### **Scenario 4: Empty Queue**

**Steps:**
1. ✅ Complete/cancel all tickets
2. ✅ Verify "No hay clientes en cola" message
3. ✅ Verify statistics show 0s
4. ✅ Verify "Llamar Cliente" button disabled/hidden

---

### 🔧 **Admin Testing**

#### **Scenario 1: Monitor All Queues**

**Steps:**
1. ✅ Login as admin/super_admin
2. ✅ Navigate to "Queue"
3. ✅ View all branches' queues
4. ✅ Filter by status
5. ✅ Sort by various fields
6. ✅ Search by ticket number/user

**Expected Results:**
- ✅ See all active tickets
- ✅ Real-time updates
- ✅ Filter/sort/search working

#### **Scenario 2: Manage Entities**

**Steps:**
1. ✅ Create/Edit/Delete franchises
2. ✅ Create/Edit/Delete branches
3. ✅ Create/Edit/Delete barbers
4. ✅ Create/Edit/Delete services
5. ✅ Verify validations work
6. ✅ Verify security rules enforce permissions

---

## ⚙️ Cloud Functions Testing

### **Manual Testing via Firebase Console**

#### **Test advanceQueue**

```bash
# Via Cloud Functions URL
curl -X POST https://advancequeue-xxx-uc.a.run.app \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -H "Content-Type: application/json" \
  -d '{"data": {"branchId": "branch1", "barberId": "user123"}}'
```

#### **Test takeTicket**

```javascript
// Via Firebase Emulator UI or production console
{
  "data": {
    "branchId": "branch1",
    "serviceId": "service1",  // optional
    "barberId": "barber1"      // optional
  }
}
```

#### **Test completeTicket**

```javascript
{
  "data": {
    "queueId": "queue123"
  }
}
```

#### **Test cancelTicket**

```javascript
{
  "data": {
    "queueId": "queue123",
    "reason": "Test cancellation"
  }
}
```

### **Expected Function Behaviors:**

| Function | Success Response | Error Cases |
|----------|------------------|-------------|
| **advanceQueue** | `{success: true, ticket: {...}}` | No tickets in queue |
| **takeTicket** | `{success: true, queueId, position}` | Already has ticket, Negative points, Queue full |
| **markArrival** | `{success: true}` | Ticket not found, Not owner, Wrong status |
| **completeTicket** | `{success: true}` | Not in_service/arrived |
| **cancelTicket** | `{success: true}` | Already completed/cancelled |

---

## 🔔 Push Notifications Testing

### **Setup Testing:**

1. ✅ Open app in Chrome (desktop or mobile)
2. ✅ Login (not as guest)
3. ✅ Click "Activar Notificaciones" banner
4. ✅ Accept browser permission dialog
5. ✅ Check console for: "FCM token registered for user"
6. ✅ Verify token saved in Firestore: `/users/{uid}/fcmTokens/`

### **Foreground Notifications:**

**Steps:**
1. ✅ Keep app open and visible
2. ✅ Have another user (or emulator) trigger notification:
   - Take a ticket → "Turno Confirmado"
   - Advance queue → "¡ES TU TURNO!"
3. ✅ Verify browser notification appears
4. ✅ Verify console logs: "Foreground message received"
5. ✅ Verify notification added to history

### **Background Notifications:**

**Steps:**
1. ✅ Take a ticket
2. ✅ Minimize app or switch tabs
3. ✅ Have barber call your ticket (advanceQueue)
4. ✅ Verify notification appears in system tray
5. ✅ Click notification
6. ✅ Verify app opens/focuses

### **Multi-Device Testing:**

**Steps:**
1. ✅ Login on Device A (e.g., Chrome desktop)
2. ✅ Login on Device B (e.g., Chrome mobile) with same account
3. ✅ Grant notifications on both
4. ✅ Take a ticket
5. ✅ Verify both devices receive notification
6. ✅ Check Firestore: 2 tokens under `/users/{uid}/fcmTokens/`

### **Token Cleanup Testing:**

**Steps:**
1. ✅ Register token on device
2. ✅ Logout
3. ✅ Verify token deleted from Firestore (check console logs)
4. ✅ Login on new device
5. ✅ Verify new token created

---

## 💰 Loyalty Points Testing

### **Test Point Additions:**

**Scenario: Complete Service**
```
Initial points: 100
Action: Complete service
Expected: 101 points
Transaction: +1, reason: "completed_service"
```

### **Test Point Deductions:**

**Scenario 1: No-Show**
```
Initial points: 100
Action: Don't mark arrival, let timer expire
Expected: 97 points
Transaction: -3, reason: "no_show"
```

**Scenario 2: Expired Timer**
```
Initial points: 100
Action: Timer expires (any status)
Expected: 97 points
Transaction: -3, reason: "expired"
```

**Scenario 3: Late Cancellation**
```
Initial points: 100
Action: Cancel after arrival
Expected: 95 points
Transaction: -5, reason: "late_cancellation"
```

### **Test Negative Points Block:**

**Steps:**
1. ✅ Set user points to -1 (manually in Firestore or via multiple no-shows)
2. ✅ Try to take a ticket
3. ✅ Verify error message appears
4. ✅ Verify ticket NOT created

### **Transaction History Testing:**

**Steps:**
1. ✅ Navigate to Profile page
2. ✅ Verify "Historial de Puntos" shows all transactions
3. ✅ Verify correct formatting:
   - Green color for +points
   - Red color for -points
   - Descriptive reasons with emojis
   - Timestamps in local format
4. ✅ Verify balance before/after displayed

---

## 🐛 Edge Cases & Error Handling

### **Edge Case 1: Concurrent Take Ticket**

**Test:** Two users try to take the same position simultaneously

**Steps:**
1. ✅ Open app in 2 browsers (User A and User B)
2. ✅ Both select same branch
3. ✅ Click "Sacar Turno" at same time
4. ✅ Verify both get tickets
5. ✅ Verify positions are sequential (not duplicate)

**Expected:** Firestore transactions handle concurrency

### **Edge Case 2: Queue Capacity**

**Test:** Attempt to exceed MAX_ADVANCE_TICKETS (2)

**Setup:** Create 2 tickets in queue

**Steps:**
1. ✅ Try to take 3rd ticket
2. ✅ Verify error: "Cola llena. Máximo 2 turnos..."

### **Edge Case 3: Orphaned Tickets**

**Test:** User deletes account with active ticket

**Steps:**
1. ✅ Create ticket
2. ✅ Manually delete user from Firestore (simulate account deletion)
3. ✅ Verify queue still functions
4. ✅ Barber can still cancel orphaned ticket

### **Edge Case 4: Timer Edge Cases**

**Test 1: Timer expires exactly at transition**
```
Scenario: User marks arrival at 9:59 of 10-minute timer
Expected: Timer stopped, arrival marked successfully
```

**Test 2: Multiple timers**
```
Scenario: User has multiple tickets (shouldn't be possible, but test)
Expected: Each ticket has independent timer
```

### **Edge Case 5: Network Disconnection**

**Steps:**
1. ✅ Take a ticket
2. ✅ Disable network
3. ✅ Try to mark arrival
4. ✅ Enable network
5. ✅ Verify action completes (Firestore offline persistence)

---

## ⚡ Performance Testing

### **Load Testing - Queue Operations**

**Scenario:** 100 concurrent users taking tickets

```javascript
// Use a load testing tool like Artillery or k6
// artillery quick --count 100 --num 10 https://comprakitsupervivencia.web.app
```

**Monitor:**
- ✅ Cloud Functions execution time (should be <2s)
- ✅ Firestore read/write latency
- ✅ UI responsiveness
- ✅ No race conditions

### **Real-time Updates Performance**

**Test:** 50 active listeners on same branch

**Steps:**
1. ✅ Open app in 50 tabs
2. ✅ All select same branch
3. ✅ Create/update tickets
4. ✅ Verify all tabs update in <500ms
5. ✅ Check network tab for websocket connections

### **Bundle Size Check**

```bash
npm run build

# Check output
# dist/assets/index-xxx.js should be <1.5MB
# gzip should be <300KB
```

---

## 🔐 Security Testing

### **Test 1: Unauthenticated Access**

**Steps:**
1. ✅ Logout
2. ✅ Try to access `/dashboard`, `/queue`, etc.
3. ✅ Verify redirect to `/login`

### **Test 2: Role-Based Access**

**Test as Client:**
```
✅ Can access: /dashboard, /client-queue, /profile
❌ Cannot access: /queue, /barber-queue, /franchises
```

**Test as Barber:**
```
✅ Can access: /dashboard, /barber-queue, /profile
❌ Cannot access: /franchises, /branches
```

### **Test 3: Firestore Security Rules**

**Test 1: Read other user's data**
```javascript
// Should FAIL
const otherUserDoc = await getDoc(doc(db, 'users', 'otherUserId'));
```

**Test 2: Modify other user's ticket**
```javascript
// Should FAIL
await updateDoc(doc(db, 'queues', 'otherUserTicketId'), {
  status: 'completed'
});
```

**Test 3: Access admin-only collections**
```javascript
// Should FAIL (as client)
await getDoc(doc(db, 'franchises', 'franchise1'));
```

### **Test 4: Cloud Functions Authorization**

**Test:** Call function without authentication
```bash
# Should return 401 Unauthenticated
curl -X POST https://advancequeue-xxx-uc.a.run.app \
  -H "Content-Type: application/json" \
  -d '{"data": {"branchId": "branch1"}}'
```

---

## 📊 Testing Checklist

### **Pre-Deployment Testing**

- [ ] All TypeScript compiles without errors
- [ ] All linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors in production build
- [ ] All environment variables set
- [ ] VAPID key configured

### **Functional Testing**

- [ ] ✅ Client can take ticket
- [ ] ✅ Client can mark arrival
- [ ] ✅ Client can cancel ticket
- [ ] ✅ Client receives push notifications
- [ ] ✅ Barber can call next client
- [ ] ✅ Barber can complete service
- [ ] ✅ Barber can cancel ticket
- [ ] ✅ Points system working correctly
- [ ] ✅ Profile page shows correct data
- [ ] ✅ Real-time updates working

### **Security Testing**

- [ ] ✅ Authentication required for all routes
- [ ] ✅ Role-based access control working
- [ ] ✅ Firestore rules deny unauthorized access
- [ ] ✅ Cloud Functions validate authentication
- [ ] ✅ No secrets in client code

### **Performance Testing**

- [ ] ✅ Initial page load <3s
- [ ] ✅ Real-time updates <500ms
- [ ] ✅ Cloud Functions <2s execution
- [ ] ✅ No memory leaks (check Chrome DevTools)

### **Cross-Browser Testing**

- [ ] ✅ Chrome (desktop + mobile)
- [ ] ✅ Firefox
- [ ] ✅ Safari (desktop + iOS)
- [ ] ✅ Edge

---

## 🚨 Common Issues & Solutions

### **Issue 1: Notifications Not Receiving**

**Symptoms:** User doesn't receive push notifications

**Debug Steps:**
1. Check browser console for FCM errors
2. Verify VAPID key is correct in .env
3. Check `/users/{uid}/fcmTokens/` in Firestore
4. Verify service worker registered: Chrome DevTools → Application → Service Workers
5. Check notification permission: `Notification.permission` should be "granted"

**Solution:**
```bash
# Regenerate VAPID key if needed
# Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Generate

# Update .env
VITE_FIREBASE_VAPID_KEY=BN1fm6Nvs...

# Rebuild
npm run build
firebase deploy --only hosting
```

### **Issue 2: Timer Not Expiring**

**Symptoms:** Tickets don't expire after 10 minutes

**Debug Steps:**
1. Check scheduled function is running: Firebase Console → Functions → checkExpiredTimers
2. Verify `timerExpiry` field in Firestore is correct timestamp
3. Check function logs for errors

**Solution:**
```bash
# Manually trigger scheduled function for testing
firebase functions:shell
> checkExpiredTimers()
```

### **Issue 3: Points Not Updating**

**Symptoms:** Loyalty points don't change after actions

**Debug Steps:**
1. Check onQueueUpdate trigger is firing
2. Verify `updateUserPoints()` function completes
3. Check loyaltyTransactions collection
4. Look for errors in Cloud Functions logs

**Solution:** Check Functions logs in Firebase Console

---

## 📈 Success Metrics

### **What to Monitor:**

1. **Queue Metrics:**
   - Average wait time
   - Completion rate
   - No-show rate
   - Cancellation rate

2. **Performance Metrics:**
   - Cloud Functions execution time
   - Firestore read/write latency
   - Page load time
   - Real-time update delay

3. **User Metrics:**
   - Daily active users
   - Tickets per day
   - Notification delivery rate
   - Average loyalty points

4. **Error Metrics:**
   - Function error rate
   - Client-side errors
   - Failed notifications
   - Security rule violations

---

## ✅ Final Testing Checklist

Before marking testing as complete:

- [ ] ✅ All user flows tested end-to-end
- [ ] ✅ All Cloud Functions tested
- [ ] ✅ All edge cases handled
- [ ] ✅ Security testing passed
- [ ] ✅ Performance acceptable
- [ ] ✅ Cross-browser compatibility verified
- [ ] ✅ Mobile testing completed
- [ ] ✅ Push notifications working
- [ ] ✅ Loyalty system validated
- [ ] ✅ Production deployment successful
- [ ] ✅ Monitoring configured
- [ ] ✅ Documentation complete

---

## 🎓 Testing Resources

- **Firebase Emulator UI**: http://localhost:4000
- **Firestore Console**: https://console.firebase.google.com/project/comprakitsupervivencia/firestore
- **Functions Logs**: https://console.firebase.google.com/project/comprakitsupervivencia/functions
- **Cloud Messaging**: https://console.firebase.google.com/project/comprakitsupervivencia/notification

---

**Happy Testing!** 🧪🎉
