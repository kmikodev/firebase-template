# Firebase Architecture: Queue Management & Social Auth

## 1. FLUJO COMPLETO TURNOS FIFO

### A. Lógica "Máximo 1-2 Turnos Antes"

**Concepto:** El cliente solo puede sacar turno si faltan máximo 1-2 personas antes que él.

**Modelo de Datos (Firestore):**

```typescript
// firestore/branches/{branchId}/queues/{queueId}
interface Queue {
  id: string;
  branchId: string;
  barberId: string;
  status: 'active' | 'paused' | 'closed';
  currentNumber: number; // Número actual siendo atendido
  lastAssignedNumber: number; // Último turno asignado
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// firestore/branches/{branchId}/queues/{queueId}/tickets/{ticketId}
interface Ticket {
  id: string;
  queueId: string;
  branchId: string;
  barberId: string;
  userId: string;
  ticketNumber: number; // Número de turno

  status: 'waiting' | 'called' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'expired';

  // Timestamps
  requestedAt: Timestamp; // Cuando sacó el turno
  arrivedAt?: Timestamp; // Cuando llegó (marca presencia)
  calledAt?: Timestamp; // Cuando fue llamado
  startedAt?: Timestamp; // Cuando comenzó atención
  completedAt?: Timestamp; // Cuando terminó
  expiresAt?: Timestamp; // 10 min después de requestedAt
  graceExpiresAt?: Timestamp; // 5 min después de calledAt

  // Metadata
  estimatedWaitMinutes: number;
  services: string[]; // IDs de servicios
  notes?: string;
}
```

**Query para Verificar si Puede Sacar Turno:**

```typescript
// functions/src/queue/canTakeTicket.ts
import { firestore } from 'firebase-admin';

interface CanTakeTicketResult {
  canTake: boolean;
  reason?: string;
  currentNumber?: number;
  nextAvailableNumber?: number;
  estimatedWaitMinutes?: number;
}

export async function canTakeTicket(
  queueId: string,
  branchId: string,
  userId: string
): Promise<CanTakeTicketResult> {
  const db = firestore();

  // 1. Verificar que la cola esté activa
  const queueDoc = await db
    .collection('branches')
    .doc(branchId)
    .collection('queues')
    .doc(queueId)
    .get();

  if (!queueDoc.exists) {
    return { canTake: false, reason: 'Queue not found' };
  }

  const queue = queueDoc.data() as Queue;

  if (queue.status !== 'active') {
    return { canTake: false, reason: 'Queue is not active' };
  }

  // 2. Verificar puntos del usuario
  const userDoc = await db.collection('users').doc(userId).get();
  const user = userDoc.data();

  if (user?.queuePoints < 0) {
    return {
      canTake: false,
      reason: 'Insufficient queue points. Please contact support.'
    };
  }

  // 3. Verificar si ya tiene un turno activo en esta cola
  const existingTicket = await db
    .collectionGroup('tickets')
    .where('userId', '==', userId)
    .where('queueId', '==', queueId)
    .where('status', 'in', ['waiting', 'called', 'in_progress'])
    .limit(1)
    .get();

  if (!existingTicket.empty) {
    return {
      canTake: false,
      reason: 'You already have an active ticket in this queue'
    };
  }

  // 4. Obtener tickets activos (waiting) ordenados por número
  const activeTicketsSnapshot = await db
    .collection('branches')
    .doc(branchId)
    .collection('queues')
    .doc(queueId)
    .collection('tickets')
    .where('status', '==', 'waiting')
    .orderBy('ticketNumber', 'asc')
    .get();

  const activeTickets = activeTicketsSnapshot.docs.map(doc => doc.data() as Ticket);

  // 5. Calcular el siguiente número disponible
  const nextNumber = queue.lastAssignedNumber + 1;

  // 6. Verificar límite de anticipación (máximo 2 turnos antes)
  const MAX_ADVANCE_TICKETS = 2;
  const currentNumber = queue.currentNumber;

  if (nextNumber - currentNumber > MAX_ADVANCE_TICKETS) {
    return {
      canTake: false,
      reason: `You can only take a ticket when there are ${MAX_ADVANCE_TICKETS} or fewer people ahead. Current: ${currentNumber}, Next available: ${nextNumber}`,
      currentNumber,
      nextAvailableNumber: currentNumber + MAX_ADVANCE_TICKETS + 1
    };
  }

  // 7. Estimar tiempo de espera (promedio 15 min por cliente)
  const AVERAGE_SERVICE_TIME = 15; // minutos
  const peopleAhead = activeTickets.filter(t => t.ticketNumber < nextNumber).length;
  const estimatedWaitMinutes = peopleAhead * AVERAGE_SERVICE_TIME;

  return {
    canTake: true,
    currentNumber,
    nextAvailableNumber: nextNumber,
    estimatedWaitMinutes
  };
}
```

---

### B. Timers (10 min llegada, 5 min gracia)

**Implementación con Firestore Timestamps + Scheduled Function:**

```typescript
// functions/src/queue/takeTicket.ts
import { firestore, Timestamp } from 'firebase-admin';

export async function takeTicket(
  queueId: string,
  branchId: string,
  barberId: string,
  userId: string,
  services: string[]
): Promise<{ success: boolean; ticketId?: string; error?: string }> {
  const db = firestore();

  // Verificar si puede sacar turno
  const canTake = await canTakeTicket(queueId, branchId, userId);

  if (!canTake.canTake) {
    return { success: false, error: canTake.reason };
  }

  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(now.toMillis() + 10 * 60 * 1000); // 10 min

  // Crear ticket en una transacción
  const ticketRef = db
    .collection('branches')
    .doc(branchId)
    .collection('queues')
    .doc(queueId)
    .collection('tickets')
    .doc();

  const queueRef = db
    .collection('branches')
    .doc(branchId)
    .collection('queues')
    .doc(queueId);

  try {
    await db.runTransaction(async (transaction) => {
      const queueDoc = await transaction.get(queueRef);
      const queue = queueDoc.data() as Queue;

      const ticketNumber = queue.lastAssignedNumber + 1;

      const ticket: Ticket = {
        id: ticketRef.id,
        queueId,
        branchId,
        barberId,
        userId,
        ticketNumber,
        status: 'waiting',
        requestedAt: now,
        expiresAt,
        estimatedWaitMinutes: canTake.estimatedWaitMinutes || 0,
        services
      };

      transaction.set(ticketRef, ticket);
      transaction.update(queueRef, { lastAssignedNumber: ticketNumber });
    });

    return { success: true, ticketId: ticketRef.id };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
```

**Scheduled Function para Checkear Expiración:**

```typescript
// functions/src/queue/checkExpiredTickets.ts
import { firestore, Timestamp } from 'firebase-admin';
import * as functions from 'firebase-functions';

// Ejecutar cada minuto
export const checkExpiredTickets = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const db = firestore();
    const now = Timestamp.now();

    // 1. Tickets que no llegaron en 10 min (status: waiting, expiresAt < now, no arrivedAt)
    const expiredWaitingQuery = await db.collectionGroup('tickets')
      .where('status', '==', 'waiting')
      .where('expiresAt', '<=', now)
      .get();

    const batch1 = db.batch();
    let count1 = 0;

    for (const doc of expiredWaitingQuery.docs) {
      const ticket = doc.data() as Ticket;

      // Si no marcó llegada, expirar
      if (!ticket.arrivedAt) {
        batch1.update(doc.ref, {
          status: 'expired',
          updatedAt: now
        });

        // Aplicar penalización
        await applyPenalty(ticket.userId, 'no_arrival', -10);
        count1++;
      }
    }

    if (count1 > 0) {
      await batch1.commit();
      console.log(`Expired ${count1} waiting tickets (no arrival)`);
    }

    // 2. Tickets llamados que no se presentaron en 5 min (status: called, graceExpiresAt < now)
    const expiredCalledQuery = await db.collectionGroup('tickets')
      .where('status', '==', 'called')
      .where('graceExpiresAt', '<=', now)
      .get();

    const batch2 = db.batch();
    let count2 = 0;

    for (const doc of expiredCalledQuery.docs) {
      const ticket = doc.data() as Ticket;

      batch2.update(doc.ref, {
        status: 'no_show',
        updatedAt: now
      });

      // Aplicar penalización más severa
      await applyPenalty(ticket.userId, 'no_show', -15);
      count2++;
    }

    if (count2 > 0) {
      await batch2.commit();
      console.log(`Expired ${count2} called tickets (no show)`);
    }
  });
```

**Funciones auxiliares:**

```typescript
// Marcar llegada (dentro de 10 min)
export async function markArrival(ticketId: string, branchId: string, queueId: string) {
  const db = firestore();
  const now = Timestamp.now();

  const ticketRef = db
    .collection('branches')
    .doc(branchId)
    .collection('queues')
    .doc(queueId)
    .collection('tickets')
    .doc(ticketId);

  const ticketDoc = await ticketRef.get();
  const ticket = ticketDoc.data() as Ticket;

  // Verificar que no haya expirado
  if (ticket.expiresAt.toMillis() < now.toMillis()) {
    throw new Error('Ticket has expired. Cannot mark arrival.');
  }

  await ticketRef.update({
    arrivedAt: now,
    status: 'waiting', // Sigue en espera
    updatedAt: now
  });
}

// Llamar cliente (inicia gracia de 5 min)
export async function callTicket(ticketId: string, branchId: string, queueId: string) {
  const db = firestore();
  const now = Timestamp.now();
  const graceExpiresAt = Timestamp.fromMillis(now.toMillis() + 5 * 60 * 1000); // 5 min

  await db
    .collection('branches')
    .doc(branchId)
    .collection('queues')
    .doc(queueId)
    .collection('tickets')
    .doc(ticketId)
    .update({
      status: 'called',
      calledAt: now,
      graceExpiresAt,
      updatedAt: now
    });
}
```

---

### C. Sistema de Puntos

**Modelo de Datos:**

```typescript
// firestore/users/{userId}
interface User {
  id: string;
  email: string;
  displayName: string;
  queuePoints: number; // Default: 100
  queueHistory: {
    totalCompleted: number;
    totalNoShows: number;
    totalExpired: number;
    totalCancelled: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// firestore/users/{userId}/queuePenalties/{penaltyId}
interface QueuePenalty {
  id: string;
  type: 'completed' | 'no_show' | 'expired' | 'cancelled_late';
  points: number; // +1, -10, -15, -5
  ticketId: string;
  reason: string;
  createdAt: Timestamp;
}
```

**Reglas de Puntos:**

- **+1:** Completar turno
- **-10:** No llegar (expira sin arrivedAt)
- **-15:** No presentarse tras ser llamado (no_show)
- **-5:** Cancelar tarde (< 30 min antes)

**Función para Aplicar Penalización:**

```typescript
// functions/src/queue/applyPenalty.ts
import { firestore, Timestamp } from 'firebase-admin';

type PenaltyType = 'completed' | 'no_arrival' | 'no_show' | 'cancelled_late';

const PENALTY_POINTS: Record<PenaltyType, number> = {
  completed: 1,
  no_arrival: -10,
  no_show: -15,
  cancelled_late: -5
};

export async function applyPenalty(
  userId: string,
  type: PenaltyType,
  points: number,
  ticketId: string = '',
  reason: string = ''
): Promise<void> {
  const db = firestore();
  const userRef = db.collection('users').doc(userId);

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    const user = userDoc.data() as User;

    const newPoints = user.queuePoints + points;

    // Actualizar puntos
    transaction.update(userRef, {
      queuePoints: newPoints,
      updatedAt: Timestamp.now()
    });

    // Registrar penalización
    const penaltyRef = userRef.collection('queuePenalties').doc();
    transaction.set(penaltyRef, {
      id: penaltyRef.id,
      type,
      points,
      ticketId,
      reason: reason || `${type} - ${points} points`,
      createdAt: Timestamp.now()
    });
  });
}
```

---

### D. Avance de Cola

```typescript
// functions/src/queue/advanceQueue.ts
import { firestore, Timestamp } from 'firebase-admin';

export async function advanceQueue(
  branchId: string,
  queueId: string,
  completedTicketNumber: number
): Promise<void> {
  const db = firestore();
  const queueRef = db
    .collection('branches')
    .doc(branchId)
    .collection('queues')
    .doc(queueId);

  await db.runTransaction(async (transaction) => {
    const queueDoc = await transaction.get(queueRef);
    const queue = queueDoc.data() as Queue;

    // Solo avanzar si el ticket completado es el actual
    if (completedTicketNumber === queue.currentNumber) {
      // Buscar siguiente ticket en espera
      const nextTicketsQuery = await db
        .collection('branches')
        .doc(branchId)
        .collection('queues')
        .doc(queueId)
        .collection('tickets')
        .where('status', '==', 'waiting')
        .where('ticketNumber', '>', queue.currentNumber)
        .orderBy('ticketNumber', 'asc')
        .limit(1)
        .get();

      if (!nextTicketsQuery.empty) {
        const nextTicket = nextTicketsQuery.docs[0].data() as Ticket;
        transaction.update(queueRef, {
          currentNumber: nextTicket.ticketNumber,
          updatedAt: Timestamp.now()
        });
      } else {
        // No hay más tickets, mantener currentNumber
        transaction.update(queueRef, {
          updatedAt: Timestamp.now()
        });
      }
    }
  });
}

// Completar ticket
export async function completeTicket(
  ticketId: string,
  branchId: string,
  queueId: string
): Promise<void> {
  const db = firestore();
  const now = Timestamp.now();

  const ticketRef = db
    .collection('branches')
    .doc(branchId)
    .collection('queues')
    .doc(queueId)
    .collection('tickets')
    .doc(ticketId);

  const ticketDoc = await ticketRef.get();
  const ticket = ticketDoc.data() as Ticket;

  // Actualizar ticket
  await ticketRef.update({
    status: 'completed',
    completedAt: now,
    updatedAt: now
  });

  // Aplicar bonificación
  await applyPenalty(ticket.userId, 'completed', 1, ticketId, 'Completed service');

  // Avanzar cola
  await advanceQueue(branchId, queueId, ticket.ticketNumber);
}
```

---

### E. Casos Edge

**1. Sucursal Cierra con Cola Pendiente:**

```typescript
export async function closeBranch(branchId: string): Promise<void> {
  const db = firestore();
  const now = Timestamp.now();

  const queuesSnapshot = await db
    .collection('branches')
    .doc(branchId)
    .collection('queues')
    .where('status', '==', 'active')
    .get();

  for (const queueDoc of queuesSnapshot.docs) {
    await queueDoc.ref.update({ status: 'closed', updatedAt: now });

    const pendingTicketsSnapshot = await queueDoc.ref
      .collection('tickets')
      .where('status', 'in', ['waiting', 'called'])
      .get();

    const batch = db.batch();

    for (const ticketDoc of pendingTicketsSnapshot.docs) {
      batch.update(ticketDoc.ref, { status: 'cancelled', updatedAt: now });
    }

    await batch.commit();
  }
}
```

**2. Dos Clientes Sacan Último Turno Simultáneamente:**

Solución: Transacción atómica en `takeTicket()` (ya implementado).

---

## 2. SOCIAL LOGIN

### A. Configuración Firebase Auth

**Proveedores:**

1. **Google:** Firebase Console → Authentication → Google → Enable
2. **Facebook:** App ID/Secret en Firebase Console
3. **Apple:** Service ID/Key en Firebase Console

**URLs de Redirect:**

- Web: `http://localhost:5173/__/auth/handler` (dev)
- Production: `https://{domain}/__/auth/handler`

---

### B. Flujo de Login (Frontend)

```typescript
// src/services/auth.service.ts
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInAnonymously
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Capacitor } from '@capacitor/core';

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

export const signInWithGoogle = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      await signInWithRedirect(auth, googleProvider);
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    }
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

export const signInAsGuest = async () => {
  const result = await signInAnonymously(auth);
  return result.user;
};
```

---

### C. Post-Login (Cloud Function)

```typescript
// functions/src/auth/onCreate.ts
import * as functions from 'firebase-functions';
import { auth, firestore, Timestamp } from 'firebase-admin';

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const db = firestore();

  const isAnonymous = user.providerData.length === 0;
  const defaultRole = isAnonymous ? 'guest' : 'client';

  await db.collection('users').doc(user.uid).set({
    id: user.uid,
    email: user.email || null,
    displayName: user.displayName || 'Guest User',
    photoURL: user.photoURL || null,
    role: defaultRole,
    isAnonymous,
    queuePoints: 100,
    queueHistory: {
      totalCompleted: 0,
      totalNoShows: 0,
      totalExpired: 0,
      totalCancelled: 0
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });

  await auth().setCustomUserClaims(user.uid, {
    role: defaultRole,
    isAnonymous
  });
});
```

---

### D. Roles y Claims

```typescript
interface CustomClaims {
  role: 'guest' | 'client' | 'barber' | 'admin' | 'franchise_admin';
  isAnonymous: boolean;
  franchiseId?: string;
  branchId?: string;
}
```

**Security Rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function hasRole(role) {
      return request.auth != null && request.auth.token.role == role;
    }

    match /users/{userId} {
      allow read: if request.auth.uid == userId || hasRole('admin');
      allow write: if request.auth.uid == userId || hasRole('admin');
    }

    match /branches/{branchId}/queues/{queueId}/tickets/{ticketId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if hasRole('barber') || hasRole('admin');
    }
  }
}
```

---

### E. Guest Mode

**Convertir Guest → Registered:**

```typescript
import { linkWithPopup } from 'firebase/auth';

export const upgradeGuestToGoogle = async () => {
  const user = auth.currentUser;

  if (!user || !user.isAnonymous) {
    throw new Error('User is not a guest');
  }

  const result = await linkWithPopup(user, googleProvider);
  return result.user;
};
```

**Migración automática en onCreate trigger** (ya implementado arriba).

---

## Resumen

- **FIFO:** Transacciones atómicas, timers con scheduled functions, sistema de puntos
- **Social Login:** Google/Facebook/Apple + Guest mode con upgrade sin pérdida de historial
- **Todo el sistema es escalable y serverless**
