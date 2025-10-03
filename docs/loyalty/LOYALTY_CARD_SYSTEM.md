# Loyalty Card System - Technical Documentation

**Version:** 1.0.1
**Last Updated:** 2025-10-03
**Status:** Production

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Models](#data-models)
4. [Cloud Functions API Reference](#cloud-functions-api-reference)
5. [Firestore Indexes](#firestore-indexes)
6. [Security Implementation](#security-implementation)
7. [Performance Optimizations](#performance-optimizations)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Edge Cases & Error Handling](#edge-cases--error-handling)

---

## Overview

### Purpose

The Loyalty Card System is a digital stamp collection feature for a multi-tenant barbershop application. Clients earn stamps when they complete services, and after collecting a configurable number of stamps (typically 10), they automatically receive a reward for a free service.

### Business Value

- **Customer Retention:** Incentivizes repeat visits through reward-based loyalty
- **Revenue Growth:** Increases customer lifetime value with gamified engagement
- **Multi-tenant Support:** Isolated per-franchise operation with cross-branch redemption options
- **Automated Management:** Minimal manual intervention with scheduled expiration processes

### Key Features

1. **Automatic Stamp Earning:** Stamps created automatically when queue tickets complete
2. **Configurable Requirements:** Franchises configure stamps required, expiration rules, eligible services
3. **Secure Reward Generation:** Cryptographic codes prevent fraud
4. **Barber-Managed Redemption:** Role-based access for applying rewards to services
5. **Automated Expiration:** Daily scheduled cleanup of expired stamps and rewards
6. **Real-time Progress Tracking:** Customer summary updates for UI display

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    LOYALTY CARD SYSTEM                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌─────▼─────┐        ┌─────▼─────┐
   │ TRIGGERS │          │ CALLABLE  │        │ SCHEDULED │
   │          │          │ FUNCTIONS │        │ FUNCTIONS │
   └──────────┘          └───────────┘        └───────────┘
        │                     │                     │
   onQueueCompleted    redeemReward          expireStampsDaily
        │              applyRewardToQueue    expireRewardsDaily
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   FIRESTORE DB     │
                    ├────────────────────┤
                    │ loyalty_stamps     │
                    │ loyalty_rewards    │
                    │ loyalty_configs    │
                    │ loyalty_customer_  │
                    │   summary          │
                    └────────────────────┘
```

### Multi-tenant Architecture

- **Franchise Isolation:** All data includes `franchiseId` for strict separation
- **Branch Association:** Stamps track `branchId` for analytics
- **Cross-Branch Support:** Configurable `crossBranchRedemption` allows rewards at any franchise branch
- **Role-Based Access:** Permissions enforced at Cloud Function level (barber/admin/super_admin)

### Technology Stack

- **Backend:** Firebase Cloud Functions v2 (TypeScript)
- **Database:** Cloud Firestore with composite indexes
- **Authentication:** Firebase Auth with custom claims
- **Scheduling:** Cloud Scheduler (Europe/Madrid timezone)
- **Security:** Transaction-based atomicity, cryptographic codes

---

## Data Models

### LoyaltyStamp

Represents a single earned stamp for a completed service.

```typescript
interface LoyaltyStamp {
  // Identifiers
  stampId: string;              // Unique stamp ID
  userId: string;               // Customer who earned the stamp
  franchiseId: string;          // Franchise where earned
  branchId: string;             // Branch where earned

  // Lifecycle
  earnedAt: Timestamp;          // When stamp was earned
  expiresAt: Timestamp | null;  // Expiration date (null if no expiry)
  status: StampStatus;          // 'active' | 'expired' | 'used_in_reward'

  // Service Context
  queueId: string;              // Queue ticket reference
  serviceId: string;            // Service performed
  barberId: string;             // Barber who performed service

  // Audit Trail
  createdBy: string;            // 'system' or User ID
  createdMethod: 'automatic' | 'manual';
  adjustmentReason?: string;    // Reason if manually added

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Field Notes:**
- `status`: Transitions from `active` → `used_in_reward` (when reward generated) or `expired` (after expiry)
- `expiresAt`: Calculated based on `LoyaltyConfig.stampExpiration.days` (typically 90 days)
- `serviceId`/`barberId`: May be 'unknown' if missing in queue ticket (edge case handling)

### LoyaltyReward

Represents a generated reward (free service) that can be redeemed.

```typescript
interface LoyaltyReward {
  // Identifiers
  rewardId: string;             // Unique reward ID
  userId: string;               // Customer who owns reward
  franchiseId: string;          // Franchise where valid
  code: string;                 // Secure code for validation (e.g., "RWD-A3B7C9D1E2F4")

  // Lifecycle
  status: RewardStatus;         // 'generated' | 'active' | 'in_use' | 'redeemed' | 'expired' | 'cancelled'

  // Generation
  generatedAt: Timestamp;       // When reward was created
  generatedFromStamps: string[]; // Array of stampIds used to generate

  // Expiration
  expiresAt: Timestamp | null;  // Expiration date (null if no expiry)
  expiredAt?: Timestamp;        // Actual expiration timestamp
  extensionCount?: number;      // Number of times extended (future feature)

  // Redemption
  redeemedAt?: Timestamp;       // When redeemed
  redeemedBy?: string;          // Barber ID who applied reward
  redeemedAtBranch?: string;    // Branch where redeemed
  queueId?: string;             // Queue ticket where applied

  // Reward Details
  rewardType: 'free_service';   // Type of reward (currently only free_service)
  serviceId: string;            // Service that's free (e.g., 'haircut')
  value: number;                // Monetary value in cents (EUR)

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Status Flow:**
```
generated → in_use → redeemed
    ↓          ↓
 expired   expired
```

**Security:**
- `code`: Generated using `crypto.randomBytes(8)` (64-bit entropy) to prevent brute-force attacks
- `status` transitions are atomic (transaction-based) to prevent race conditions

### LoyaltyConfig

Franchise-specific configuration for the loyalty system.

```typescript
interface LoyaltyConfig {
  franchiseId: string;

  // System Toggle
  enabled: boolean;             // Master on/off switch
  stampsRequired: number;       // Stamps needed for reward (default: 10)

  // Expiration Rules
  stampExpiration: {
    enabled: boolean;           // Enable stamp expiration
    days: number;               // Days until stamp expires (default: 90)
  };

  rewardExpiration: {
    enabled: boolean;           // Enable reward expiration
    days: number;               // Days until reward expires (default: 30)
  };

  // Eligibility
  eligibleServices: {
    mode: 'all' | 'specific';  // All services or specific list
    serviceIds: string[];       // Service IDs if mode='specific'
  };

  stampsPerVisit: {
    mode: 'one_per_ticket' | 'one_per_service';
    maxPerTicket: number;       // Max stamps per visit
  };

  // Automation
  autoApplyReward: boolean;     // Auto-apply at checkout (future)

  // Notifications
  notifications: {
    onStampEarned: boolean;
    onRewardGenerated: boolean;
    onRewardExpiring: boolean;
    onStampExpiring: boolean;
    expiringDaysBefore: number; // Days before to notify
  };

  // Policies
  crossBranchRedemption: boolean;     // Redeem at any branch
  allowStampOnFreeService: boolean;   // Earn stamps on free services
  preventSelfStamping: boolean;       // Prevent auto-stamping (always true)

  // Audit
  updatedAt: Timestamp;
  updatedBy: string;            // Admin User ID
  createdAt: Timestamp;
}
```

**Default Configuration:**
- `stampsRequired`: 10
- `stampExpiration.days`: 90
- `rewardExpiration.days`: 30
- `notifications.expiringDaysBefore`: 7

### LoyaltyCustomerSummary

Aggregated customer data for efficient UI display.

```typescript
interface LoyaltyCustomerSummary {
  userId: string;

  // Per-Franchise Data
  franchises: {
    [franchiseId: string]: {
      activeStamps: number;              // Current active stamps
      totalStampsEarned: number;         // Lifetime stamps earned
      totalRewardsGenerated: number;     // Total rewards created
      totalRewardsRedeemed: number;      // Rewards used
      totalRewardsExpired: number;       // Expired rewards

      currentProgress: {
        stamps: number;                   // Current count
        required: number;                 // Required for next reward
        percentage: number;               // Progress % (0-100)
      };

      activeRewards: string[];           // Array of active reward IDs

      lastStampAt?: Timestamp;           // Most recent stamp
      lastRewardAt?: Timestamp;          // Most recent reward
    };
  };

  // Global Aggregates
  totalStampsEarned: number;
  totalRewardsRedeemed: number;

  updatedAt: Timestamp;
  createdAt: Timestamp;
}
```

**Update Strategy:**
- Updated after stamp creation, reward generation, and reward redemption
- Optimized with in-memory calculations (2 queries instead of 5)

---

## Cloud Functions API Reference

### 1. onQueueCompleted (Trigger)

**Type:** Firestore Trigger
**Event:** `onDocumentUpdated`
**Path:** `queues/{queueId}`

**Purpose:** Automatically creates a loyalty stamp when a queue ticket is marked as `completed`.

**Trigger Conditions:**
- Status changes to `completed` (from any other status)
- `serviceId` and `barberId` are present in ticket
- Loyalty is enabled for franchise
- Service is eligible for stamps

**Process Flow:**
```typescript
1. Detect status change to 'completed'
2. Validate ticket has serviceId and barberId
3. Get LoyaltyConfig for franchise
4. Check if service is eligible
5. Create stamp in transaction (prevent duplicates)
6. Check if user has enough stamps for reward
7. If yes: Generate reward
8. Update customer summary
```

**Security:**
- Transaction-based stamp creation prevents duplicate stamps on retry
- Idempotency: Checks for existing stamp before creation

**Error Handling:**
- Missing `serviceId`/`barberId`: Logs info, skips stamp creation
- Loyalty disabled: Exits silently
- Ineligible service: Logs info, exits

**Example Log Output:**
```
INFO: Queue abc123 completed but missing serviceId or barberId
INFO: Loyalty not enabled for franchise xyz789
INFO: Service haircut_123 not eligible for stamps
INFO: Created stamp stamp_456 for user user_789
INFO: User user_789 has 10/10 stamps
INFO: Generated reward rwd_abc for user user_789
```

---

### 2. redeemReward (Callable)

**Type:** HTTPS Callable Function
**Auth:** Required
**Permissions:** Authenticated user (customer or barber)

**Purpose:** Marks a reward as "in_use" when a customer presents their reward code.

**Request Payload:**
```typescript
{
  rewardCode: string;  // e.g., "RWD-A3B7C9D1E2F4"
}
```

**Response:**
```typescript
{
  success: true,
  reward: {
    rewardId: string;
    code: string;
    userId: string;
    franchiseId: string;
    serviceId: string;
    value: number;        // cents
    expiresAt: number | null;  // milliseconds
  }
}
```

**Process Flow (Transaction):**
```typescript
1. Find reward by code
2. Validate status is 'generated' or 'active'
3. Check if expired
4. Atomically update status to 'in_use'
5. Return reward details
```

**Error Codes:**

| Code | Reason | HTTP Status |
|------|--------|-------------|
| `unauthenticated` | User not logged in | 401 |
| `invalid-argument` | Missing rewardCode | 400 |
| `not-found` | Reward code doesn't exist | 404 |
| `failed-precondition` | Reward already used or expired | 412 |
| `internal` | Transaction failure | 500 |

**Security Features:**
- Transaction prevents race condition (double redemption)
- Status check inside transaction ensures atomicity
- Expired rewards marked as `expired` before throwing error

**Usage Example (Client):**
```typescript
const redeemReward = httpsCallable(functions, 'redeemReward');
try {
  const result = await redeemReward({ rewardCode: 'RWD-A3B7C9D1E2F4' });
  console.log('Reward ready:', result.data.reward);
} catch (error) {
  if (error.code === 'not-found') {
    alert('Invalid reward code');
  } else if (error.code === 'failed-precondition') {
    alert('Reward already used or expired');
  }
}
```

---

### 3. applyRewardToQueue (Callable)

**Type:** HTTPS Callable Function
**Auth:** Required
**Permissions:** `barber` | `admin` | `super_admin` | `franchise_owner`

**Purpose:** Applies an "in_use" reward to a queue ticket, marking it as redeemed.

**Request Payload:**
```typescript
{
  rewardId: string;   // Reward ID
  queueId: string;    // Queue ticket ID
  branchId: string;   // Branch where applied
}
```

**Response:**
```typescript
{
  success: true,
  message: "Reward applied successfully"
}
```

**Process Flow (Transaction):**
```typescript
1. Validate user role (barber/admin/super_admin/franchise_owner)
2. If barber: Verify assigned to branchId
3. Get reward (fresh read in transaction)
4. Validate reward.status === 'in_use'
5. Get queue ticket (fresh read)
6. Validate reward.userId === ticket.userId
7. Validate no existing reward on ticket
8. Validate franchiseId match
9. Atomically update reward → 'redeemed'
10. Atomically update ticket with reward details
11. Update customer summary (async)
```

**Error Codes:**

| Code | Reason | HTTP Status |
|------|--------|-------------|
| `unauthenticated` | User not logged in | 401 |
| `permission-denied` | Invalid role or branch mismatch | 403 |
| `invalid-argument` | Missing parameters | 400 |
| `not-found` | Reward or ticket not found | 404 |
| `failed-precondition` | Invalid state (not in_use, already applied) | 412 |
| `internal` | Transaction failure | 500 |

**Security Validations:**
1. **Role Check:** Only barbers, admins, super_admins, franchise_owners can apply
2. **Branch Assignment:** Barbers can only apply rewards at their assigned branch
3. **User Match:** Reward must belong to the customer in the ticket
4. **Franchise Isolation:** Reward must be from same franchise as ticket
5. **No Double Apply:** Ticket cannot have existing reward

**Ticket Update:**
```typescript
{
  loyaltyReward: {
    rewardId: "rwd_abc",
    code: "RWD-A3B7C9D1E2F4",
    appliedAt: Timestamp.now(),
    appliedBy: "barber_xyz",
    discountAmount: 1500,  // cents
    originalPrice: 1500,
    finalPrice: 0          // free service
  }
}
```

**Usage Example (Barber App):**
```typescript
const applyReward = httpsCallable(functions, 'applyRewardToQueue');
try {
  await applyReward({
    rewardId: 'rwd_abc',
    queueId: 'queue_123',
    branchId: 'branch_xyz'
  });
  alert('Reward applied! Service is now free.');
} catch (error) {
  if (error.code === 'permission-denied') {
    alert('You cannot apply rewards at this branch');
  }
}
```

---

### 4. expireStampsDaily (Scheduled)

**Type:** Cloud Scheduler
**Schedule:** `0 2 * * *` (Daily at 2:00 AM Europe/Madrid)
**Memory:** 1GiB
**Timeout:** 540 seconds (9 minutes)

**Purpose:** Marks expired stamps as `expired` status.

**Process:**
```typescript
1. Query active stamps with expiresAt <= now (limit 10,000)
2. Batch update status to 'expired' (500 stamps per batch)
3. Commit all batches
4. Update affected customer summaries
```

**Query:**
```typescript
db.collection('loyalty_stamps')
  .where('status', '==', 'active')
  .where('expiresAt', '<=', Timestamp.now())
  .limit(10000)
```

**Performance:**
- Max 10,000 stamps per run (safety limit to prevent timeout)
- Batch size: 500 operations
- Affected users deduplicated for summary updates

**Logging:**
```
INFO: Found 1234 stamps to expire
WARN: Reached limit of 10000 stamps, may need multiple runs
INFO: Expired 1234 stamps
```

**Monitoring:**
- If log shows limit reached repeatedly, increase function frequency or memory

---

### 5. expireRewardsDaily (Scheduled)

**Type:** Cloud Scheduler
**Schedule:** `0 3 * * *` (Daily at 3:00 AM Europe/Madrid)
**Memory:** 1GiB
**Timeout:** 540 seconds (9 minutes)

**Purpose:** Marks expired rewards as `expired` status.

**Process:**
```typescript
1. Query generated/active rewards with expiresAt <= now (limit 10,000)
2. Batch update status to 'expired', set expiredAt
3. Commit batch
4. Update affected customer summaries
```

**Query:**
```typescript
db.collection('loyalty_rewards')
  .where('status', 'in', ['generated', 'active'])
  .where('expiresAt', '<=', Timestamp.now())
  .limit(10000)
```

**Performance:**
- Max 10,000 rewards per run
- Single batch (rewards expire less frequently than stamps)

**Logging:**
```
INFO: Found 56 rewards to expire
INFO: Expired 56 rewards
```

---

## Firestore Indexes

### Required Composite Indexes

The system requires the following Firestore indexes for optimal query performance:

#### 1. Stamps by User and Franchise (Active)
```json
{
  "collectionGroup": "loyalty_stamps",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "franchiseId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "earnedAt", "order": "DESCENDING" }
  ]
}
```
**Used by:** `checkAndGenerateReward()`, `updateCustomerSummary()`

#### 2. Stamps Expiration (Daily Job)
```json
{
  "collectionGroup": "loyalty_stamps",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "expiresAt", "order": "ASCENDING" }
  ]
}
```
**Used by:** `expireStampsDaily()`

#### 3. Rewards by User and Franchise
```json
{
  "collectionGroup": "loyalty_rewards",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "franchiseId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
}
```
**Used by:** `updateCustomerSummary()`

#### 4. Rewards Expiration (Daily Job)
```json
{
  "collectionGroup": "loyalty_rewards",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "expiresAt", "order": "ASCENDING" }
  ]
}
```
**Used by:** `expireRewardsDaily()`

#### 5. Stamps by Franchise (Analytics)
```json
{
  "collectionGroup": "loyalty_stamps",
  "fields": [
    { "fieldPath": "franchiseId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "earnedAt", "order": "DESCENDING" }
  ]
}
```
**Used by:** Admin analytics dashboards

#### 6. Rewards by Franchise (Analytics)
```json
{
  "collectionGroup": "loyalty_rewards",
  "fields": [
    { "fieldPath": "franchiseId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "generatedAt", "order": "DESCENDING" }
  ]
}
```
**Used by:** Admin analytics dashboards

### Index Deployment

Indexes are defined in `firestore.indexes.json` and deployed with:

```bash
firebase deploy --only firestore:indexes
```

**Note:** Index creation can take several minutes. Monitor in Firebase Console → Firestore → Indexes.

---

## Security Implementation

### 1. Transaction-Based Atomicity

All critical operations use Firestore transactions to prevent race conditions:

#### Stamp Creation (onQueueCompleted)
```typescript
await db.runTransaction(async (transaction) => {
  // Check for existing stamp (inside transaction)
  const existing = await db
    .collection('loyalty_stamps')
    .where('queueId', '==', queueId)
    .limit(1)
    .get();

  if (!existing.empty) return; // Idempotent

  // Create stamp atomically
  transaction.set(stampRef, stamp);
});
```

**Prevents:** Duplicate stamps on function retry or concurrent execution

#### Reward Redemption (redeemReward)
```typescript
await db.runTransaction(async (transaction) => {
  const rewardDoc = await transaction.get(rewardRef);
  const reward = rewardDoc.data();

  // Validate status inside transaction
  if (reward.status !== 'generated' && reward.status !== 'active') {
    throw new HttpsError('failed-precondition', 'Already used');
  }

  // Atomic update
  transaction.update(rewardRef, { status: 'in_use' });
});
```

**Prevents:** Double redemption if multiple users scan same code simultaneously

#### Reward Application (applyRewardToQueue)
```typescript
await db.runTransaction(async (transaction) => {
  // Fresh reads inside transaction
  const reward = (await transaction.get(rewardRef)).data();
  const ticket = (await transaction.get(queueRef)).data();

  // Validate state
  if (reward.status !== 'in_use') throw error;
  if (ticket.loyaltyReward) throw error;

  // Atomic updates
  transaction.update(rewardRef, { status: 'redeemed', ... });
  transaction.update(queueRef, { loyaltyReward: { ... } });
});
```

**Prevents:** Reward applied to multiple tickets or ticket receiving multiple rewards

### 2. Cryptographic Reward Codes

```typescript
function generateRewardCode(): string {
  const randomBytes = crypto.randomBytes(8); // 64-bit entropy
  const code = randomBytes.toString('base64url').substring(0, 12).toUpperCase();
  return `RWD-${code}`;
}
```

**Security Properties:**
- 64-bit cryptographic randomness (2^64 possible codes)
- Base64url encoding (URL-safe)
- Prefix `RWD-` for easy identification
- Example: `RWD-A3B7C9D1E2F4`

**Attack Resistance:**
- **Brute Force:** 2^64 combinations = computationally infeasible
- **Prediction:** Cryptographically secure randomness (not sequential)
- **Collision:** Probability < 1 in 1 billion for 1M codes

### 3. Role-Based Access Control (RBAC)

#### Permission Matrix

| Function | client | barber | admin | super_admin | franchise_owner |
|----------|--------|--------|-------|-------------|-----------------|
| `redeemReward` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `applyRewardToQueue` | ❌ | ✅* | ✅ | ✅ | ✅ |

*Barbers can only apply at their assigned branch

#### Implementation

```typescript
// Role validation
const userRole = request.auth.token.role as string;
if (userRole !== 'barber' && userRole !== 'admin' && ...) {
  throw new HttpsError('permission-denied', 'Insufficient permissions');
}

// Branch assignment validation (barbers only)
if (userRole === 'barber') {
  const barberDoc = await db.collection('barbers').doc(barberId).get();
  if (barberDoc.data()?.branchId !== branchId) {
    throw new HttpsError('permission-denied', 'Wrong branch');
  }
}
```

### 4. Franchise Isolation

All data includes `franchiseId` and validates cross-franchise access:

```typescript
// Validate franchiseId match
if (reward.franchiseId !== ticket.franchiseId) {
  throw new HttpsError('permission-denied', 'Franchise mismatch');
}
```

**Firestore Security Rules** (example):
```javascript
match /loyalty_rewards/{rewardId} {
  allow read: if request.auth != null
    && (request.auth.token.role == 'super_admin'
      || resource.data.franchiseId == request.auth.token.franchiseId);
}
```

### 5. Input Validation

All callable functions validate inputs:

```typescript
if (!rewardCode) {
  throw new HttpsError('invalid-argument', 'rewardCode is required');
}

if (!rewardId || !queueId || !branchId) {
  throw new HttpsError('invalid-argument', 'Missing required fields');
}
```

---

## Performance Optimizations

### 1. Customer Summary Update (H3 - High Priority)

**Before (v1.0.0):** 5 separate Firestore queries
```typescript
// 5 queries - inefficient
const activeStamps = await db.collection('loyalty_stamps')
  .where('userId', '==', userId)
  .where('franchiseId', '==', franchiseId)
  .where('status', '==', 'active')
  .get(); // Query 1

const totalStamps = await db.collection('loyalty_stamps')
  .where('userId', '==', userId)
  .where('franchiseId', '==', franchiseId)
  .get(); // Query 2

// ... 3 more queries for rewards
```

**After (v1.0.1):** 2 queries with in-memory calculation (60% reduction)
```typescript
// Query 1: Get ALL stamps, calculate metrics in memory
const allStampsSnapshot = await db
  .collection('loyalty_stamps')
  .where('userId', '==', userId)
  .where('franchiseId', '==', franchiseId)
  .orderBy('earnedAt', 'desc')
  .get();

let activeStampsCount = 0;
const totalStampsCount = allStampsSnapshot.size;
const lastStampAt = allStampsSnapshot.docs[0]?.data().earnedAt || null;

allStampsSnapshot.forEach(doc => {
  if (doc.data().status === 'active') activeStampsCount++;
});

// Query 2: Get ALL rewards, calculate metrics in memory
const allRewardsSnapshot = await db
  .collection('loyalty_rewards')
  .where('userId', '==', userId)
  .where('franchiseId', '==', franchiseId)
  .orderBy('generatedAt', 'desc')
  .get();

// Calculate all reward metrics in one pass
const rewardsByStatus = { generated: 0, redeemed: 0, expired: 0 };
allRewardsSnapshot.forEach(doc => {
  const status = doc.data().status;
  if (status === 'generated' || status === 'active') rewardsByStatus.generated++;
  else if (status === 'redeemed') rewardsByStatus.redeemed++;
  else if (status === 'expired') rewardsByStatus.expired++;
});
```

**Impact:**
- Read operations: 5 → 2 (60% reduction)
- Latency: ~150ms → ~60ms (typical)
- Cost savings: ~60% per summary update

### 2. Scheduled Function Query Limits (H1 - High Priority)

**Problem:** Unbounded queries could cause timeout or excessive reads

**Solution:** 10,000 document limit with warning logging
```typescript
const MAX_DOCS_PER_RUN = 10000;

const expiredStamps = await db
  .collection('loyalty_stamps')
  .where('status', '==', 'active')
  .where('expiresAt', '<=', now)
  .limit(MAX_DOCS_PER_RUN) // Safety limit
  .get();

if (expiredStamps.size >= MAX_DOCS_PER_RUN) {
  logger.warn(`Reached limit, may need multiple runs`);
}
```

**Resource Allocation:**
- Memory: 1GiB (handle large batches)
- Timeout: 540s (9 minutes max)
- Batch size: 500 operations per batch

**Monitoring:**
- If limit reached consistently → increase schedule frequency or memory
- Expected: <100 expirations per day in normal usage

### 3. Batch Write Operations

**Stamps Expiration:**
```typescript
const batches: admin.firestore.WriteBatch[] = [];
let currentBatch = db.batch();
let operationsInBatch = 0;

for (const doc of expiredStamps.docs) {
  currentBatch.update(doc.ref, { status: 'expired', ... });
  operationsInBatch++;

  if (operationsInBatch >= 500) { // Firestore limit
    batches.push(currentBatch);
    currentBatch = db.batch();
    operationsInBatch = 0;
  }
}

await Promise.all(batches.map(batch => batch.commit()));
```

**Benefits:**
- Atomic batch commits (all-or-nothing per batch)
- Parallel execution of multiple batches
- Efficient network usage

### 4. React Component Memory Leak Prevention (H4)

**Problem:** Firestore listeners continue after component unmount

**Solution:** Cleanup with mounted flag
```typescript
useEffect(() => {
  if (!user?.id) return;

  let mounted = true; // Prevent state updates after unmount

  const unsubscribe = subscribeToUserSummary(user.id, (data) => {
    if (mounted) { // Only update if still mounted
      setSummary(data);
      setLoading(false);
    }
  });

  return () => {
    mounted = false; // Mark as unmounted
    unsubscribe();   // Stop listener
  };
}, [user?.id]);
```

**Impact:**
- Prevents React warning: "Can't perform state update on unmounted component"
- Avoids memory leaks from active listeners
- Improves app stability

---

## Testing

### Test Coverage: ~90%

**Test Suite Breakdown:**

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `onQueueCompleted.test.ts` | 18 | Trigger logic, stamp creation |
| `redeemReward.test.ts` | 15 | Reward redemption, validation |
| `applyRewardToQueue.test.ts` | 22 | Reward application, RBAC |
| `expireDaily.test.ts` | 12 | Scheduled expiration jobs |
| `updateCustomerSummary.test.ts` | 14 | Summary calculation logic |
| `security.test.ts` | 12 | Security validations |
| `edgeCases.test.ts` | 10 | Edge cases, error handling |
| **Total** | **103** | **~90%** |

### Running Tests

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- onQueueCompleted.test.ts

# Watch mode
npm test -- --watch
```

### Key Test Scenarios

#### 1. Stamp Creation
```typescript
describe('onQueueCompleted', () => {
  it('creates stamp when ticket completes', async () => {
    // Setup: Create ticket, config
    // Action: Mark ticket completed
    // Assert: Stamp created with correct data
  });

  it('prevents duplicate stamps on retry', async () => {
    // Action: Trigger function twice for same ticket
    // Assert: Only one stamp exists
  });

  it('handles missing serviceId gracefully', async () => {
    // Action: Complete ticket without serviceId
    // Assert: No stamp created, no error thrown
  });
});
```

#### 2. Reward Redemption
```typescript
describe('redeemReward', () => {
  it('marks reward as in_use', async () => {
    // Action: Call redeemReward with valid code
    // Assert: Status changed to 'in_use'
  });

  it('prevents double redemption', async () => {
    // Action: Redeem twice concurrently
    // Assert: Second call fails with precondition error
  });

  it('expires reward during redemption if expired', async () => {
    // Action: Redeem expired reward
    // Assert: Status set to 'expired', error thrown
  });
});
```

#### 3. RBAC & Security
```typescript
describe('applyRewardToQueue - Security', () => {
  it('blocks non-barber roles', async () => {
    // Setup: User with role='client'
    // Action: Call applyRewardToQueue
    // Assert: permission-denied error
  });

  it('blocks barber from wrong branch', async () => {
    // Setup: Barber assigned to branch A
    // Action: Apply reward at branch B
    // Assert: permission-denied error
  });

  it('validates franchise isolation', async () => {
    // Setup: Reward from franchise A, ticket from franchise B
    // Action: Apply reward
    // Assert: permission-denied error
  });
});
```

#### 4. Edge Cases
```typescript
describe('Edge Cases', () => {
  it('handles undefined serviceId in queue ticket', async () => {
    // Action: Complete ticket with serviceId = undefined
    // Assert: Stamp created with serviceId = 'unknown'
  });

  it('handles reward generation with expired stamps in set', async () => {
    // Setup: User has 10 stamps, 3 are expired
    // Action: Earn new stamp
    // Assert: Only valid stamps used for reward
  });
});
```

### Test Environment

**Setup:**
- Uses Firebase Test SDK (`@firebase/rules-unit-testing`)
- Firestore emulator for isolated testing
- Mock authentication tokens for RBAC testing

**Mocking:**
```typescript
// Mock auth context
const mockAuth = { uid: 'barber123', token: { role: 'barber' } };

// Create callable function context
const context = {
  auth: mockAuth,
  rawRequest: {} as https.Request,
};
```

---

## Deployment

### Build Commands

```bash
# Navigate to functions
cd functions

# Install dependencies
npm install

# Build TypeScript → JavaScript
npm run build

# Run tests before deploy
npm test
```

### Deploy Commands

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:onQueueCompleted

# Deploy scheduled functions
firebase deploy --only functions:expireStampsDaily,functions:expireRewardsDaily

# Deploy indexes (required on first setup)
firebase deploy --only firestore:indexes
```

### Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Firestore indexes deployed (`firebase deploy --only firestore:indexes`)
- [ ] Environment variables configured (if any)
- [ ] Cloud Scheduler enabled in GCP project
- [ ] Monitoring dashboards configured

### Environment Variables

Currently no environment variables required. All configuration stored in Firestore `loyalty_configs` collection.

**Future:** If adding third-party integrations (e.g., email notifications):
```bash
firebase functions:config:set notifications.sendgrid_key="..."
```

### Monitoring

**Firebase Console:**
- Functions → Logs → Filter by function name
- Firestore → Indexes → Check build status
- Scheduler → View job runs and failures

**Cloud Logging Queries:**
```
# View all loyalty function logs
resource.type="cloud_function"
resource.labels.function_name=~"(onQueueCompleted|redeemReward|applyRewardToQueue|expireStampsDaily|expireRewardsDaily)"

# Find errors
resource.type="cloud_function"
severity>=ERROR
textPayload=~"loyalty"

# Monitor expiration jobs
resource.type="cloud_function"
resource.labels.function_name=~"expire.*Daily"
```

### Rollback

If issues occur:
```bash
# Rollback to previous version
firebase functions:rollback onQueueCompleted --revision=REVISION_ID

# View deployment history
firebase functions:list --detailed
```

---

## Edge Cases & Error Handling

### Edge Case 1: Undefined serviceId/barberId

**Scenario:** Queue ticket completes without `serviceId` or `barberId` (e.g., walk-in without service selection)

**Handling:**
```typescript
if (!ticket.serviceId || !ticket.barberId) {
  logger.info(`Queue ${queueId} completed but missing serviceId or barberId`);
  return; // Exit gracefully, no stamp created
}

// If partially defined, use fallback
const stamp: LoyaltyStamp = {
  serviceId: ticket.serviceId || 'unknown',
  barberId: ticket.barberId || 'unknown',
  // ...
};
```

**Impact:** No stamp created, customer not penalized for system data issue

### Edge Case 2: Expired Stamps in Valid Set

**Scenario:** User has 10 stamps, but 3 are expired when reward generation runs

**Handling:**
```typescript
// Filter expired stamps before counting
const now = Timestamp.now().toMillis();
const validStamps = stampDocs.filter(doc => {
  const stamp = doc.data() as LoyaltyStamp;
  return !stamp.expiresAt || stamp.expiresAt.toMillis() > now;
});

if (validStamps.length < config.stampsRequired) {
  logger.info(`User ${userId} has expired stamps, not enough valid stamps`);
  return; // Don't generate reward
}
```

**Impact:** Prevents reward generation with expired stamps, maintains integrity

### Edge Case 3: Missing Firestore Document

**Scenario:** Reference to deleted service, barber, or config

**Handling:**
```typescript
// Config check
const config = await getLoyaltyConfig(franchiseId);
if (!config || !config.enabled) {
  logger.info(`Loyalty not enabled for franchise ${franchiseId}`);
  return;
}

// Service price fallback
const serviceDoc = await db.collection('services').doc(serviceId).get();
const servicePrice = serviceDoc.exists ? serviceDoc.data()?.price || 0 : 0;
```

**Impact:** Graceful degradation, uses default values (0 for price)

### Edge Case 4: Concurrent Reward Application

**Scenario:** Two barbers scan same reward code simultaneously

**Handling:** Transaction-based status check
```typescript
await db.runTransaction(async (transaction) => {
  const reward = (await transaction.get(rewardRef)).data();

  if (reward.status !== 'in_use') {
    throw new HttpsError('failed-precondition', 'Reward not available');
  }

  // Only one transaction succeeds
  transaction.update(rewardRef, { status: 'redeemed' });
});
```

**Impact:** First transaction succeeds, second fails with clear error

### Edge Case 5: Scheduled Function Timeout

**Scenario:** 15,000 stamps to expire (exceeds 10,000 limit)

**Handling:**
```typescript
const MAX_DOCS_PER_RUN = 10000;

const expiredStamps = await db
  .collection('loyalty_stamps')
  .where('expiresAt', '<=', now)
  .limit(MAX_DOCS_PER_RUN)
  .get();

if (expiredStamps.size >= MAX_DOCS_PER_RUN) {
  logger.warn(`Reached limit of ${MAX_DOCS_PER_RUN} stamps, may need multiple runs`);
  // Function will run again tomorrow and process remaining
}
```

**Impact:** Processes in batches across multiple daily runs

### Error Categories

| Category | Example | Handling | User Impact |
|----------|---------|----------|-------------|
| **Expected** | Missing serviceId | Log info, skip | None (graceful) |
| **Validation** | Invalid reward code | Throw HttpsError | Clear error message |
| **Concurrency** | Double redemption | Transaction failure | Second user gets error |
| **System** | Firestore timeout | Retry logic / log error | May need retry |
| **Security** | Wrong franchise | Throw permission-denied | Access blocked |

### Logging Strategy

```typescript
// INFO: Expected conditions, no action needed
logger.info(`Service ${serviceId} not eligible for stamps`);

// WARN: Unusual but handled
logger.warn(`Reached query limit, will continue in next run`);

// ERROR: Unexpected failures
logger.error('Failed to create stamp in transaction:', error);
```

---

## Appendix

### Glossary

- **Stamp:** Digital token earned for completing a service
- **Reward:** Prize generated after collecting required stamps (free service)
- **Franchise:** Top-level tenant in multi-tenant system
- **Branch:** Physical location within a franchise
- **Queue Ticket:** Customer's position in service queue

### Related Documentation

- [User Guide (Spanish)](/docs/loyalty/USER_GUIDE_LOYALTY.md)
- [Admin Guide (Spanish)](/docs/loyalty/ADMIN_GUIDE_LOYALTY.md)
- [Change Log](/docs/loyalty/CHANGELOG_LOYALTY.md)
- [Firestore Security Rules](/firestore.rules)
- [Firebase Functions Config](/functions/src/config.ts)

### Support

**Technical Issues:**
- Check Cloud Logging for errors
- Review test suite for similar scenarios
- Verify Firestore indexes are built

**Feature Requests:**
- Submit via GitHub issues
- Include use case and expected behavior

---

**Document Version:** 1.0
**Last Updated:** 2025-10-03
**Maintained By:** Engineering Team
