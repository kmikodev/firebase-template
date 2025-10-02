# 📚 API Documentation - Queue Management System

Complete reference for all Cloud Functions and Firestore collections.

---

## 🔥 Cloud Functions API

All functions are deployed in **europe-west1** (except setSuperAdmin* in us-central1).

Base URL: `https://{functionName}-xxx-europe-west1.cloudfunctions.net`

---

### 🎫 Queue Management Functions

#### **1. advanceQueue** (Callable)

Call the next person in the queue.

**HTTP Method:** POST
**Authentication:** Required
**Region:** europe-west1

**Request:**
```typescript
interface AdvanceQueueRequest {
  branchId: string;      // Required
  barberId?: string;     // Optional - defaults to current user
}
```

**Response:**
```typescript
interface AdvanceQueueResponse {
  success: boolean;
  ticket?: {
    queueId: string;
    ticketNumber: string;
    userId: string;
    position: number;
  };
  message?: string;  // If no tickets in queue
}
```

**Error Responses:**
```typescript
// 401 Unauthenticated
{ code: 'unauthenticated', message: 'User must be authenticated' }

// 400 Invalid Argument
{ code: 'invalid-argument', message: 'branchId is required' }

// 500 Internal Error
{ code: 'internal', message: 'Failed to advance queue' }
```

**Example Usage:**
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions(app, 'europe-west1');
const advanceQueue = httpsCallable(functions, 'advanceQueue');

const result = await advanceQueue({
  branchId: 'branch1',
  barberId: 'barber123'  // optional
});

console.log(result.data);
// { success: true, ticket: { queueId: '...', ticketNumber: 'BRANCH-20251002-001', ... } }
```

---

#### **2. takeTicket** (Callable)

Client takes a queue ticket.

**HTTP Method:** POST
**Authentication:** Required
**Region:** europe-west1

**Request:**
```typescript
interface TakeTicketRequest {
  branchId: string;       // Required
  serviceId?: string;     // Optional
  barberId?: string;      // Optional - preference
}
```

**Validations:**
- User not already in queue for this branch
- User has queuePoints >= 0
- Queue not full (max 2 tickets ahead of current)

**Response:**
```typescript
interface TakeTicketResponse {
  success: boolean;
  queueId: string;
  position: number;
  message: string;
}
```

**Error Responses:**
```typescript
// 409 Already Exists
{ code: 'already-exists', message: 'Ya tienes un turno activo en esta sucursal' }

// 403 Permission Denied
{ code: 'permission-denied', message: 'No puedes sacar turno con puntos negativos (-X)...' }

// 429 Resource Exhausted
{ code: 'resource-exhausted', message: 'Cola llena. Máximo 2 turnos de anticipación permitidos' }
```

**Side Effects:**
- Creates ticket in `/queues/` collection
- Starts 10-minute arrival timer
- Triggers `onQueueCreate` → sends confirmation notification
- Calculates position and ticket number

**Example:**
```javascript
const takeTicket = httpsCallable(functions, 'takeTicket');

const result = await takeTicket({
  branchId: 'branch1',
  serviceId: 'haircut',     // optional
  barberId: 'preferred-barber'  // optional
});

// { success: true, queueId: 'queue123', position: 3, message: 'Turno creado exitosamente' }
```

---

#### **3. markArrival** (Callable)

Client marks arrival at the branch.

**HTTP Method:** POST
**Authentication:** Required (must be ticket owner)
**Region:** europe-west1

**Request:**
```typescript
interface MarkArrivalRequest {
  queueId: string;  // Required
}
```

**Validations:**
- Ticket exists
- User owns the ticket
- Ticket status is 'waiting'

**Response:**
```typescript
interface MarkArrivalResponse {
  success: boolean;
  message: string;
}
```

**Side Effects:**
- Updates ticket status: waiting → arrived
- Stops 10-minute timer
- Sets `arrivedAt` timestamp

**Example:**
```javascript
const markArrival = httpsCallable(functions, 'markArrival');

await markArrival({ queueId: 'queue123' });
// { success: true, message: 'Llegada confirmada' }
```

---

#### **4. completeTicket** (Callable)

Mark service as complete (barber action).

**HTTP Method:** POST
**Authentication:** Required
**Region:** europe-west1

**Request:**
```typescript
interface CompleteTicketRequest {
  queueId: string;  // Required
}
```

**Validations:**
- Ticket exists
- Ticket status is 'in_service' or 'arrived'

**Response:**
```typescript
interface CompleteTicketResponse {
  success: boolean;
  message: string;
}
```

**Side Effects:**
- Updates ticket status → completed
- Sets `completedAt` timestamp
- Triggers `onQueueUpdate` → awards +1 loyalty point
- Reorders queue positions

**Example:**
```javascript
const completeTicket = httpsCallable(functions, 'completeTicket');

await completeTicket({ queueId: 'queue123' });
// { success: true, message: 'Servicio completado' }
```

---

#### **5. cancelTicket** (Callable)

Cancel a queue ticket.

**HTTP Method:** POST
**Authentication:** Required (owner or admin)
**Region:** europe-west1

**Request:**
```typescript
interface CancelTicketRequest {
  queueId: string;   // Required
  reason?: string;   // Optional cancellation reason
}
```

**Validations:**
- Ticket exists
- Ticket status is active (waiting, notified, arrived, in_service)
- User owns ticket OR has admin role

**Response:**
```typescript
interface CancelTicketResponse {
  success: boolean;
  message: string;
}
```

**Side Effects:**
- Updates ticket status → cancelled
- Saves `cancelReason`
- Applies penalty if late cancellation (after arrival): -5 points
- Triggers `onQueueUpdate` → processes penalties
- Reorders queue positions

**Example:**
```javascript
const cancelTicket = httpsCallable(functions, 'cancelTicket');

await cancelTicket({
  queueId: 'queue123',
  reason: 'Cliente no puede asistir'
});
// { success: true, message: 'Turno cancelado' }
```

---

### 🔔 Queue Triggers

#### **6. onQueueCreate** (Firestore Trigger)

Automatically fires when a new ticket is created.

**Trigger:** `onCreate` on `/queues/{queueId}`

**Actions:**
1. Calculate exact position in queue
2. Generate ticket number (BRANCH-YYYYMMDD-###)
3. Set 10-minute arrival timer
4. Calculate estimated wait time (30 min per person ahead)
5. Send confirmation push notification
6. Create notification document

**Notification Payload:**
```json
{
  "title": "🎫 Turno Confirmado",
  "body": "Tu turno es #BRANCH-20251002-001. Posición 3 en la cola. Tiempo estimado: 90 min.",
  "data": {
    "type": "ticket_confirmed",
    "queueId": "queue123",
    "ticketNumber": "BRANCH-20251002-001",
    "position": "3"
  }
}
```

---

#### **7. onQueueUpdate** (Firestore Trigger)

Automatically fires when a ticket is updated.

**Trigger:** `onUpdate` on `/queues/{queueId}`

**Status Transitions Handled:**

| From → To | Actions |
|-----------|---------|
| `waiting → arrived` | Stop arrival timer, set arrivedAt timestamp |
| `waiting → notified` | Start 5-min grace timer, send "your turn" notification |
| `notified → in_service` | Stop grace timer, set serviceStartedAt |
| `in_service → completed` | Award +1 loyalty point, reorder queue |
| `* → cancelled` | Apply penalties if late, reorder queue |
| `* → expired` | Set expiredAt, reorder queue |

**Notifications Sent:**

**"Your Turn" Notification (status → notified):**
```json
{
  "title": "🎉 ¡ES TU TURNO!",
  "body": "Turno #BRANCH-20251002-001. Preséntate en el mostrador ahora. Tienes 5 minutos.",
  "data": {
    "type": "your_turn",
    "queueId": "queue123",
    "ticketNumber": "BRANCH-20251002-001"
  }
}
```

**Loyalty Points Logic:**
```typescript
// Completed service
if (after.status === 'completed') {
  await updateUserPoints(userId, +1, 'completed_service', queueId);
}

// Late cancellation (after arrival)
if (after.status === 'cancelled' && after.cancelReason === 'late_cancellation') {
  await updateUserPoints(userId, -5, 'late_cancellation', queueId);
}
```

---

### ⏰ Scheduled Functions

#### **8. checkExpiredTimers** (Scheduled)

Runs every 1 minute to check for expired timers.

**Schedule:** `every 1 minutes`
**Region:** europe-west1

**Logic:**
1. Query all tickets with `timerExpiry < now()`
2. For each expired ticket:
   - If status is 'waiting': Mark as expired, apply -3 points (no-show)
   - If status is 'notified': Mark as expired, apply -3 points (no-show)
   - Reorder queue positions

**Example Expiry Scenarios:**
```
Ticket A: status=waiting, timerExpiry=10:00 (10-min arrival timer)
Current time: 10:01
Action: Mark as expired, -3 points (no-show penalty)

Ticket B: status=notified, timerExpiry=10:05 (5-min grace timer)
Current time: 10:06
Action: Mark as expired, -3 points (no-show penalty)
```

---

### 👤 Auth Functions

#### **9. updateUserRole** (Auth Trigger)

Automatically fires when a new user is created.

**Trigger:** `onCreate` on Auth user

**Actions:**
1. Create user document in `/users/{uid}`
2. Set default role: 'guest' (anonymous) or 'client' (authenticated)
3. Initialize queuePoints: 100
4. Initialize queueHistory counters

**Example User Document:**
```typescript
{
  id: 'user123',
  email: 'user@example.com',
  displayName: 'John Doe',
  photoURL: 'https://...',
  phoneNumber: null,
  role: 'client',
  isAnonymous: false,
  queuePoints: 100,
  queueHistory: {
    totalCompleted: 0,
    totalNoShows: 0,
    totalExpired: 0,
    totalCancelled: 0
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

#### **10. setSuperAdmin** (Callable)

Set a user as super_admin (admin-only function).

**HTTP Method:** POST
**Authentication:** Required (super_admin only)
**Region:** us-central1

**Request:**
```typescript
interface SetSuperAdminRequest {
  email: string;  // User email to promote
}
```

---

#### **11. setSuperAdminHTTP** (HTTP)

HTTP endpoint to set super admin (for initial setup).

**HTTP Method:** POST
**Region:** us-central1
**URL:** https://setsuperadminhttp-xxx-uc.a.run.app

**Query Parameters:**
- `email` (required): Email of user to promote

**Example:**
```bash
curl "https://setsuperadminhttp-xxx-uc.a.run.app?email=admin@example.com"
```

---

## 🗄️ Firestore Collections

### **users** Collection

**Path:** `/users/{userId}`

**Document Structure:**
```typescript
interface User {
  id: string;                    // User ID (matches Auth UID)
  email: string | null;
  displayName: string;
  photoURL: string | null;
  phoneNumber: string | null;
  role: 'super_admin' | 'franchise_owner' | 'admin' | 'barber' | 'client' | 'guest';
  isAnonymous: boolean;
  queuePoints: number;           // Loyalty points
  queueHistory: {
    totalCompleted: number;
    totalNoShows: number;
    totalExpired: number;
    totalCancelled: number;
  };
  franchiseId?: string;          // If franchise_owner
  branchId?: string;             // If barber
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Subcollection:** `/users/{userId}/fcmTokens/{tokenId}`
```typescript
interface FCMToken {
  token: string;                 // FCM registration token
  device: {
    userAgent: string;
    platform: string;
  };
  createdAt: Timestamp;
  lastUsedAt: Timestamp;
}
```

**Security Rules:**
```javascript
// Users can read their own document
allow read: if request.auth != null && request.auth.uid == userId;

// Users can update their own document (limited fields)
allow update: if request.auth != null
  && request.auth.uid == userId
  && !request.resource.data.diff(resource.data).affectedKeys()
    .hasAny(['role', 'queuePoints', 'queueHistory']);
```

---

### **queues** Collection

**Path:** `/queues/{queueId}`

**Document Structure:**
```typescript
interface QueueTicket {
  queueId: string;
  userId: string;
  branchId: string;
  serviceId: string | null;
  barberId: string | null;

  status: 'waiting' | 'arrived' | 'notified' | 'in_service' | 'completed' | 'cancelled' | 'expired';
  position: number;              // Position in queue
  ticketNumber: string;          // BRANCH-YYYYMMDD-###

  timerExpiry: Timestamp | null; // When current timer expires
  estimatedWaitTime: number;     // Estimated wait in minutes

  cancelReason?: string;         // If cancelled

  createdAt: Timestamp;
  updatedAt: Timestamp;
  arrivedAt?: Timestamp;
  notifiedAt?: Timestamp;
  serviceStartedAt?: Timestamp;
  completedAt?: Timestamp;
  cancelledAt?: Timestamp;
  expiredAt?: Timestamp;
}
```

**Status Flow:**
```
waiting → arrived → notified → in_service → completed
   ↓         ↓          ↓            ↓
expired   expired   expired      cancelled
   ↓         ↓          ↓
cancelled cancelled cancelled
```

**Security Rules:**
```javascript
// Users can read their own tickets
allow read: if request.auth != null
  && (request.auth.uid == resource.data.userId
      || hasRole(['admin', 'barber', 'super_admin']));

// Users can create their own tickets
allow create: if request.auth != null
  && request.auth.uid == request.resource.data.userId;

// Only owners can update their own tickets (limited fields)
allow update: if request.auth != null
  && request.auth.uid == resource.data.userId
  && request.resource.data.diff(resource.data).affectedKeys()
    .hasOnly(['status', 'arrivedAt', 'updatedAt']);

// Barbers/admins can update any ticket
allow update: if request.auth != null
  && hasRole(['admin', 'barber', 'super_admin']);
```

---

### **notifications** Collection

**Path:** `/notifications/{notificationId}`

**Document Structure:**
```typescript
interface Notification {
  notificationId: string;
  userId: string;                // Recipient
  type: 'ticket_confirmed' | 'your_turn' | 'queue_warning';
  title: string;
  body: string;
  data: Record<string, any>;     // Additional data
  read: boolean;
  createdAt: Timestamp;
}
```

**Example:**
```json
{
  "notificationId": "notif123",
  "userId": "user123",
  "type": "your_turn",
  "title": "¡ES TU TURNO!",
  "body": "Turno #BRANCH-20251002-001 - Preséntate ahora",
  "data": {
    "queueId": "queue123",
    "ticketNumber": "BRANCH-20251002-001"
  },
  "read": false,
  "createdAt": "2025-10-02T18:30:00Z"
}
```

**Security Rules:**
```javascript
// Users can read their own notifications
allow read: if request.auth != null
  && request.auth.uid == resource.data.userId;

// Users can update read status on their own notifications
allow update: if request.auth != null
  && request.auth.uid == resource.data.userId
  && request.resource.data.diff(resource.data).affectedKeys()
    .hasOnly(['read']);
```

---

### **loyaltyTransactions** Collection

**Path:** `/loyaltyTransactions/{transactionId}`

**Document Structure:**
```typescript
interface LoyaltyTransaction {
  transactionId: string;
  userId: string;
  points: number;                // +/- points (e.g., +1, -3, -5)
  reason: 'completed_service' | 'no_show' | 'expired' | 'late_cancellation';
  queueId: string;               // Related ticket
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Timestamp;
}
```

**Example:**
```json
{
  "transactionId": "tx123",
  "userId": "user123",
  "points": -3,
  "reason": "no_show",
  "queueId": "queue123",
  "balanceBefore": 100,
  "balanceAfter": 97,
  "createdAt": "2025-10-02T18:35:00Z"
}
```

**Security Rules:**
```javascript
// Users can read their own transactions
allow read: if request.auth != null
  && request.auth.uid == resource.data.userId;

// Only Cloud Functions can write
allow write: if false;  // Deny all client writes
```

---

### **branches** Collection

**Path:** `/branches/{branchId}`

**Document Structure:**
```typescript
interface Branch {
  branchId: string;
  franchiseId: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  hours: {
    monday: { open: string, close: string };
    tuesday: { open: string, close: string };
    // ...
  };
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 🔄 Data Flow Examples

### **Example 1: Complete Queue Flow**

```
1. Client calls takeTicket()
   → Creates ticket in /queues/ (status: waiting)
   → onQueueCreate trigger fires
   → Generates ticket number
   → Starts 10-min timer
   → Sends "Turno Confirmado" notification

2. Client calls markArrival()
   → Updates ticket (status: arrived)
   → onQueueUpdate trigger fires
   → Stops timer

3. Barber calls advanceQueue()
   → Updates ticket (status: notified)
   → onQueueUpdate trigger fires
   → Starts 5-min grace timer
   → Sends "¡ES TU TURNO!" notification

4. Client presents at counter
   → Barber manually updates (status: in_service)
   → onQueueUpdate trigger fires
   → Stops timer

5. Barber calls completeTicket()
   → Updates ticket (status: completed)
   → onQueueUpdate trigger fires
   → Awards +1 loyalty point
   → Creates transaction record
   → Reorders queue
```

### **Example 2: No-Show Flow**

```
1. Client calls takeTicket()
   → Ticket created (status: waiting)
   → 10-min timer starts

2. Client doesn't mark arrival
   → Timer expires after 10 minutes

3. checkExpiredTimers runs (scheduled every 1 min)
   → Finds expired ticket
   → Updates ticket (status: expired)
   → Awards -3 loyalty points
   → Creates transaction record
   → Reorders queue
```

---

## 🔐 Authentication & Authorization

### **Custom Claims Structure:**

```typescript
interface CustomClaims {
  role: 'super_admin' | 'franchise_owner' | 'admin' | 'barber' | 'client' | 'guest';
  isAnonymous: boolean;
  franchiseId?: string;
  branchId?: string;
}
```

### **Role Permissions:**

| Role | Permissions |
|------|-------------|
| **super_admin** | Full access to everything |
| **franchise_owner** | Manage their franchise, branches, barbers, services |
| **admin** | Manage branch, barbers, services, view queues |
| **barber** | Manage queue, complete/cancel tickets |
| **client** | Take tickets, view own tickets, manage profile |
| **guest** | Limited access (can't take tickets) |

---

## 📊 Rate Limits & Quotas

### **Cloud Functions:**
- **Concurrent executions:** 1000 (Firebase Blaze plan)
- **Timeout:** 60s (Gen 2 functions)
- **Memory:** 256MB default
- **Max requests:** 10,000/day (Blaze plan - scales with usage)

### **Firestore:**
- **Reads:** 50,000/day (free tier), unlimited (Blaze plan)
- **Writes:** 20,000/day (free tier), unlimited (Blaze plan)
- **Deletes:** 20,000/day (free tier), unlimited (Blaze plan)
- **Real-time listeners:** 100 simultaneous connections (free tier)

### **FCM:**
- **Messages:** Unlimited (free)
- **Topic subscribers:** 2000 per topic

---

## 🚨 Error Codes Reference

| Code | HTTP | Description | Solution |
|------|------|-------------|----------|
| `unauthenticated` | 401 | User not authenticated | Login required |
| `permission-denied` | 403 | Insufficient permissions | Check user role or negative points |
| `invalid-argument` | 400 | Invalid request data | Verify request parameters |
| `already-exists` | 409 | Resource already exists | User already has active ticket |
| `not-found` | 404 | Resource not found | Ticket/user doesn't exist |
| `resource-exhausted` | 429 | Quota exceeded | Queue is full |
| `failed-precondition` | 400 | Operation not allowed in current state | Check ticket status |
| `internal` | 500 | Server error | Check logs, retry |

---

## 📚 Additional Resources

- **Firebase Documentation:** https://firebase.google.com/docs
- **Cloud Functions Gen 2:** https://firebase.google.com/docs/functions
- **Firestore Security Rules:** https://firebase.google.com/docs/firestore/security
- **FCM Web Setup:** https://firebase.google.com/docs/cloud-messaging/js/client

---

**API Version:** 1.0.0
**Last Updated:** 2025-10-02
**Project:** comprakitsupervivencia
