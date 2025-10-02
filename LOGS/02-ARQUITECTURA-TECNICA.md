# Arquitectura Técnica - App Multitenant de Peluquerías

## 1. Stack Técnico Recomendado

### Frontend
- **React 18 + TypeScript + Vite**
  - Razón: Ya configurado en proyecto, rápido, type-safe
- **Capacitor 6**
  - Apps nativas iOS/Android desde misma codebase
  - Push notifications (FCM)
  - Geolocalización, cámara
- **Tailwind CSS**
  - Diseño responsive mobile-first
  - Sistema de diseño consistente
- **TanStack Query (React Query)**
  - Caché inteligente, refetch automático
  - Sincronización server-state
- **Zustand**
  - State management local (UI, sesión)
  - Más ligero que Redux

### Backend
- **Firebase Cloud Functions (Gen 2, Node 20)**
  - Serverless, escala automático
  - Triggers Firestore, Scheduled, HTTP
- **TypeScript**
  - Type safety end-to-end
- **Express.js (dentro de functions)**
  - Routing HTTP functions

### Base de Datos
- **Firestore (Native Mode)**
  - Real-time listeners (colas en vivo)
  - Offline persistence
  - Escalable globalmente
  - Queries flexibles con índices

### Autenticación
- **Firebase Auth**
  - Email/password
  - Google, Apple Sign-In
  - Phone authentication
  - Custom claims para roles

### Notificaciones
- **Firebase Cloud Messaging (FCM)**
  - Push notifications iOS/Android/Web
  - Topics para broadcast
  - Data + notification payloads

### Storage
- **Firebase Storage**
  - Fotos perfil usuarios
  - Fotos galería trabajos
  - Logos franquicias

### Hosting
- **Firebase Hosting**
  - PWA con service worker
  - CDN global
  - SSL automático
  - Rewrites a functions

### Monitoreo
- **Firebase Analytics**
- **Crashlytics**
- **Cloud Logging**
- **Custom Metrics (Cloud Functions)**

---

## 2. Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENTE (React App)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  iOS App │  │Android   │  │  Web PWA │  │Admin Web │   │
│  │(Capacitor│  │   App    │  │          │  │  Panel   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       └──────────────┴─────────────┴─────────────┘          │
│                         │                                    │
│                    TanStack Query                           │
│                  (caché + sync)                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ Firebase SDK
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                    FIREBASE BACKEND                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Firebase Authentication                  │  │
│  │  (JWT tokens, custom claims: role, franchiseId)      │  │
│  └────────────┬─────────────────────────────────────────┘  │
│               │                                             │
│  ┌────────────┴─────────────────────────────────────────┐  │
│  │                   Firestore                           │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│  │  │   users    │  │franchises  │  │  branches  │     │  │
│  │  └────────────┘  └────────────┘  └────────────┘     │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│  │  │   queue    │  │appointments│  │  services  │     │  │
│  │  │(real-time) │  │            │  │            │     │  │
│  │  └────────────┘  └────────────┘  └────────────┘     │  │
│  │                                                       │  │
│  │  Security Rules: validate role, franchiseId, data    │  │
│  └────────────┬──────────────────────────────────────────┘  │
│               │ triggers                                    │
│  ┌────────────┴──────────────────────────────────────────┐  │
│  │           Cloud Functions (TypeScript)                │  │
│  │                                                        │  │
│  │  Triggers:                                            │  │
│  │  • onQueueCreate → start timers, notify barber       │  │
│  │  • onQueueUpdate → handle status changes             │  │
│  │  • onAppointmentCreate → reserve slot                │  │
│  │                                                        │  │
│  │  Scheduled:                                           │  │
│  │  • checkExpiredTimers (every 1 min)                  │  │
│  │  • cleanupOldRecords (daily)                         │  │
│  │  • sendDailyReports (daily)                          │  │
│  │                                                        │  │
│  │  HTTP:                                                │  │
│  │  • POST /queue/join (validaciones server-side)       │  │
│  │  • POST /appointment/book                            │  │
│  │  • POST /admin/reports                               │  │
│  │  • POST /loyalty/redeem                              │  │
│  └────────────┬──────────────────────────────────────────┘  │
│               │                                             │
│  ┌────────────┴──────────────────────────────────────────┐  │
│  │        Firebase Cloud Messaging (FCM)                 │  │
│  │  • Notificaciones push multi-dispositivo             │  │
│  │  • Topics por franquicia/sucursal                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            Firebase Storage                           │  │
│  │  /users/{uid}/profile.jpg                            │  │
│  │  /franchises/{fid}/logo.jpg                          │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Flujo de Datos Principal (Cliente se une a cola)

```
1. Cliente (App) → HTTP Function /queue/join
   ↓
2. Function valida:
   - Auth token válido
   - Cliente existe en branch
   - Branch abierto
   - Cliente no está en otra cola activa
   ↓
3. Function crea documento en /queue
   ↓
4. Firestore Trigger onQueueCreate:
   - Calcula posición en cola
   - Inicia timer 10 min (guarda timestamp)
   - Envía push al cliente (turno #X)
   - Envía push a barberos de sucursal
   ↓
5. Real-time listener en App:
   - Actualiza UI con posición en vivo
   - Muestra timer countdown
   ↓
6. Scheduled Function (cada 1 min):
   - Busca documentos con timer expirado
   - Cambia status a 'expired'
   - Trigger onQueueUpdate → notifica cliente
```

---

## 3. Estrategia Multitenant

### Principios

1. **Tenant ID = franchiseId**
   - Cada documento lleva `franchiseId` (excepto `users`, `franchises`)
   - Permite filtrar por franquicia en queries
   - Habilita índices compuestos eficientes

2. **Clientes Compartidos Globalmente**
   - Colección `users` única, sin `franchiseId`
   - Cliente puede tener historial en múltiples franquicias
   - Sistema de puntos global (unificado)

3. **Datos Aislados por Franquicia**
   - `branches`, `barbers`, `services`: tienen `franchiseId`
   - `queue`, `appointments`: tienen `franchiseId` + `branchId`
   - Security Rules validan que usuario tenga acceso a ese `franchiseId`

### Separación de Datos

```
/users (global)
  /{userId}
    - uid
    - email
    - phone
    - role: 'client' | 'barber' | 'franchise_owner' | 'super_admin'
    - loyaltyPoints (global)
    - franchiseId (solo si role != 'client') // rol asociado a franquicia

/franchises (tenant raíz)
  /{franchiseId}
    - name
    - ownerId (ref a /users)
    - country
    - language
    - settings

/branches (tenant)
  /{branchId}
    - franchiseId  ← CLAVE
    - name
    - address
    - hours
    - geolocation

/barbers (tenant)
  /{barberId}
    - franchiseId  ← CLAVE
    - branchId
    - userId (ref a /users)
    - schedule

/services (tenant)
  /{serviceId}
    - franchiseId  ← CLAVE
    - branchId (null si global a franquicia)
    - name
    - price
    - duration

/queue (tenant + branch)
  /{queueId}
    - franchiseId  ← CLAVE
    - branchId     ← CLAVE
    - userId
    - status: 'waiting' | 'arrived' | 'in_service' | 'completed' | 'expired'
    - position
    - createdAt
    - arrivedAt
    - timerExpiry (timestamp)

/appointments (tenant + branch)
  /{appointmentId}
    - franchiseId  ← CLAVE
    - branchId     ← CLAVE
    - userId
    - barberId
    - serviceId
    - dateTime
    - status
```

### Índices Compuestos Necesarios

```javascript
// Para queries multi-tenant
queue:
  [franchiseId, branchId, status, createdAt]
  [franchiseId, userId, status]
  [franchiseId, branchId, timerExpiry] // scheduled function

appointments:
  [franchiseId, branchId, dateTime]
  [franchiseId, barberId, dateTime]
  [franchiseId, userId, dateTime]

branches:
  [franchiseId, status]

barbers:
  [franchiseId, branchId, status]

services:
  [franchiseId, branchId]
```

### Acceso por Rol

- **Client**: ve solo sus datos, puede crear queue/appointments en cualquier branch
- **Barber**: accede solo a su `franchiseId` + `branchId`
- **Franchise Owner**: accede a todo su `franchiseId` (todas branches)
- **Super Admin**: accede a todo (panel admin global)

---

## 4. Modelo de Datos Firestore (Detallado)

### 4.1. `/users`

**Propósito**: Usuarios del sistema (clientes + staff)

```typescript
{
  uid: string;                    // ID (mismo que Auth UID)
  email: string;
  phone?: string;
  displayName: string;
  photoURL?: string;
  role: 'client' | 'barber' | 'franchise_owner' | 'super_admin';

  // Solo si role != 'client':
  franchiseId?: string;           // franquicia asociada a rol
  branchId?: string;              // barbero: sucursal asignada

  // Loyalty (global):
  loyaltyPoints: number;          // puntos acumulados en todas franquicias

  // Notificaciones:
  fcmTokens: string[];            // tokens FCM de dispositivos
  notificationPreferences: {
    queueUpdates: boolean;
    promotions: boolean;
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Índices**:
- `[role, franchiseId]` (listar staff de franquicia)
- `phone` (buscar por teléfono)

**Security Rules** (conceptual):
- Read: usuario mismo, o staff de franquicia si cliente visitó esa franquicia
- Write: usuario mismo (solo campos no sensibles), admin de franquicia (roles)

---

### 4.2. `/franchises`

**Propósito**: Franquicias (tenants raíz)

```typescript
{
  franchiseId: string;            // ID
  name: string;
  ownerId: string;                // ref /users (franchise_owner)
  country: string;                // 'AR', 'CL', 'MX', etc.
  language: string;               // 'es', 'pt', 'en'
  timezone: string;               // 'America/Buenos_Aires'

  settings: {
    queueEnabled: boolean;
    appointmentsEnabled: boolean;
    loyaltyEnabled: boolean;
    loyaltyRate: number;          // puntos por $1 gastado
  };

  branding: {
    logoURL?: string;
    primaryColor: string;
    secondaryColor: string;
  };

  subscription: {
    plan: 'trial' | 'basic' | 'pro' | 'enterprise';
    status: 'active' | 'suspended';
    expiresAt: Timestamp;
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Índices**:
- `ownerId` (franquicias de un owner)
- `[subscription.status, subscription.expiresAt]` (scheduled function verificar)

**Security Rules**:
- Read: owner, super_admin, staff de franquicia
- Write: owner, super_admin

---

### 4.3. `/branches`

**Propósito**: Sucursales de franquicias

```typescript
{
  branchId: string;               // ID
  franchiseId: string;            // ← TENANT ID
  name: string;
  address: string;
  geolocation: GeoPoint;
  phone: string;

  hours: {                        // horario por día
    monday: { open: '09:00', close: '18:00' } | null; // null = cerrado
    tuesday: { open: '09:00', close: '18:00' } | null;
    // ... resto días
  };

  capacity: {
    barbers: number;              // cant barberos activos
    queueMax: number;             // máx personas en cola
  };

  status: 'active' | 'inactive';

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Índices**:
- `[franchiseId, status]`
- `geolocation` (geoqueries, buscar sucursales cercanas)

**Security Rules**:
- Read: cualquiera (lista pública de sucursales)
- Write: owner de franquicia, super_admin

---

### 4.4. `/barbers`

**Propósito**: Barberos (staff que atiende)

```typescript
{
  barberId: string;               // ID
  franchiseId: string;            // ← TENANT ID
  branchId: string;               // sucursal asignada
  userId: string;                 // ref /users (role: 'barber')

  schedule: {                     // horario semanal
    monday: { start: '09:00', end: '18:00', break?: { start: '13:00', end: '14:00' } };
    // ... resto días
  };

  specialties: string[];          // ['corte', 'barba', 'color']
  status: 'active' | 'on_break' | 'off_duty';

  stats: {                        // métricas
    totalServices: number;
    avgServiceTime: number;       // minutos
    rating: number;               // 0-5
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Índices**:
- `[franchiseId, branchId, status]` (listar barberos activos de sucursal)
- `userId` (buscar por usuario)

**Security Rules**:
- Read: clientes (ver barberos disponibles), staff franquicia
- Write: owner franquicia, super_admin

---

### 4.5. `/services`

**Propósito**: Servicios ofrecidos (corte, barba, etc.)

```typescript
{
  serviceId: string;              // ID
  franchiseId: string;            // ← TENANT ID
  branchId?: string;              // null = servicio global franquicia

  name: string;                   // "Corte Clásico"
  description: string;
  price: number;                  // en centavos
  currency: string;               // 'ARS', 'USD', etc.
  duration: number;               // minutos

  category: 'corte' | 'barba' | 'color' | 'combo';
  imageURL?: string;

  status: 'active' | 'inactive';

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Índices**:
- `[franchiseId, branchId, status]`
- `[franchiseId, category, status]`

**Security Rules**:
- Read: cualquiera (lista pública)
- Write: owner franquicia, super_admin

---

### 4.6. `/queue` (CRÍTICA - Real-time)

**Propósito**: Cola FIFO en tiempo real

```typescript
{
  queueId: string;                // ID
  franchiseId: string;            // ← TENANT ID
  branchId: string;               // ← BRANCH ID
  userId: string;                 // cliente en cola

  position: number;               // posición en cola (1, 2, 3...)
  status: 'waiting'               // esperando llamado
        | 'notified'              // notificado (tu turno)
        | 'arrived'               // llegó (dentro de 5 min gracia)
        | 'in_service'            // siendo atendido
        | 'completed'             // atención completada
        | 'cancelled'             // cancelado por cliente
        | 'expired';              // expirado (no llegó a tiempo)

  // Timers:
  createdAt: Timestamp;           // unión a cola
  notifiedAt?: Timestamp;         // cuándo fue llamado
  timerExpiry?: Timestamp;        // 10 min desde notifiedAt, o 5 min desde arrivedAt
  arrivedAt?: Timestamp;          // cuándo marcó "llegué"
  serviceStartedAt?: Timestamp;
  serviceCompletedAt?: Timestamp;

  // Barbero asignado:
  barberId?: string;              // asignado cuando status = 'notified'

  // Metadata:
  serviceId?: string;             // servicio solicitado (opcional)
  estimatedWaitTime: number;      // minutos estimados (calculado)

  updatedAt: Timestamp;
}
```

**Índices CRÍTICOS**:
- `[franchiseId, branchId, status, createdAt]` (query cola activa)
- `[franchiseId, userId, status]` (verificar si cliente ya en cola)
- `[franchiseId, branchId, timerExpiry]` (scheduled function buscar expirados)
- `[barberId, status]` (cola de barbero)

**Security Rules**:
- Read: cliente (su propio doc), staff de sucursal (toda la cola)
- Write: solo Cloud Functions (validaciones complejas server-side)

**Listeners Real-time**:
- Cliente: escucha su propio doc (`onSnapshot`)
- Staff: escucha cola completa de su sucursal

---

### 4.7. `/appointments`

**Propósito**: Turnos reservados (no FIFO)

```typescript
{
  appointmentId: string;          // ID
  franchiseId: string;            // ← TENANT ID
  branchId: string;
  userId: string;                 // cliente
  barberId: string;               // barbero asignado
  serviceId: string;

  dateTime: Timestamp;            // fecha/hora turno
  duration: number;               // minutos (copiado de service)

  status: 'scheduled'             // reservado
        | 'confirmed'             // confirmado por cliente
        | 'in_progress'           // en curso
        | 'completed'             // completado
        | 'cancelled'             // cancelado
        | 'no_show';              // no se presentó

  price: number;                  // precio al momento de reserva
  currency: string;

  notes?: string;                 // notas cliente/barbero

  // Recordatorios:
  reminderSent: boolean;          // push 1h antes

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Índices**:
- `[franchiseId, branchId, dateTime]` (calendario sucursal)
- `[franchiseId, barberId, dateTime]` (agenda barbero)
- `[franchiseId, userId, dateTime]` (historial cliente)
- `[franchiseId, dateTime, status]` (reportes)

**Security Rules**:
- Read: cliente (sus turnos), staff sucursal
- Write: cliente (crear/cancelar), staff (actualizar status)

---

### 4.8. `/notifications`

**Propósito**: Log de notificaciones enviadas (auditoría)

```typescript
{
  notificationId: string;         // ID
  userId: string;                 // destinatario
  type: 'queue_update'
      | 'appointment_reminder'
      | 'promotion'
      | 'loyalty_reward';

  title: string;
  body: string;

  data: Record<string, any>;      // payload custom

  sentAt: Timestamp;
  readAt?: Timestamp;

  deliveryStatus: 'sent' | 'failed';
  fcmResponse?: any;              // respuesta FCM
}
```

**Índices**:
- `[userId, sentAt]` (historial notificaciones usuario)
- `[type, sentAt]` (reportes)

**Security Rules**:
- Read: usuario mismo
- Write: solo Cloud Functions

---

### 4.9. `/loyaltyTransactions` (opcional pero recomendado)

**Propósito**: Historial transacciones puntos

```typescript
{
  transactionId: string;
  userId: string;
  franchiseId: string;            // franquicia donde ganó/gastó puntos

  type: 'earned' | 'redeemed';
  points: number;                 // positivo (earned) o negativo (redeemed)

  reason: string;                 // "Servicio $500" | "Canje descuento"
  relatedId?: string;             // appointmentId o queueId

  balanceAfter: number;           // balance después de transacción

  createdAt: Timestamp;
}
```

**Índices**:
- `[userId, createdAt]` (historial usuario)
- `[franchiseId, createdAt]` (reportes franquicia)

---

## 5. Security Rules (Conceptual)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Funciones helper
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function hasRole(role) {
      return isAuthenticated() && request.auth.token.role == role;
    }

    function belongsToFranchise(franchiseId) {
      return isAuthenticated() && request.auth.token.franchiseId == franchiseId;
    }

    function isSuperAdmin() {
      return hasRole('super_admin');
    }

    // USERS
    match /users/{userId} {
      allow read: if isOwner(userId) || isSuperAdmin();
      allow update: if isOwner(userId) &&
                       !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'franchiseId', 'loyaltyPoints']);
      allow create: if isAuthenticated() && request.auth.uid == userId;
    }

    // FRANCHISES
    match /franchises/{franchiseId} {
      allow read: if belongsToFranchise(franchiseId) || isSuperAdmin();
      allow write: if (hasRole('franchise_owner') && belongsToFranchise(franchiseId)) || isSuperAdmin();
    }

    // BRANCHES
    match /branches/{branchId} {
      allow read: if true; // público
      allow write: if belongsToFranchise(resource.data.franchiseId) || isSuperAdmin();
    }

    // BARBERS
    match /barbers/{barberId} {
      allow read: if true; // público (ver barberos disponibles)
      allow write: if belongsToFranchise(resource.data.franchiseId) || isSuperAdmin();
    }

    // SERVICES
    match /services/{serviceId} {
      allow read: if true; // público
      allow write: if belongsToFranchise(resource.data.franchiseId) || isSuperAdmin();
    }

    // QUEUE (CRÍTICO)
    match /queue/{queueId} {
      allow read: if isOwner(resource.data.userId) ||
                     belongsToFranchise(resource.data.franchiseId) ||
                     isSuperAdmin();

      // SOLO Cloud Functions pueden escribir (validaciones complejas)
      allow write: if false;
    }

    // APPOINTMENTS
    match /appointments/{appointmentId} {
      allow read: if isOwner(resource.data.userId) ||
                     belongsToFranchise(resource.data.franchiseId) ||
                     isSuperAdmin();

      allow create: if isAuthenticated() &&
                       request.resource.data.userId == request.auth.uid;

      allow update: if isOwner(resource.data.userId) ||
                       belongsToFranchise(resource.data.franchiseId);
    }

    // NOTIFICATIONS
    match /notifications/{notificationId} {
      allow read: if isOwner(resource.data.userId);
      allow write: if false; // solo functions
    }

    // LOYALTY TRANSACTIONS
    match /loyaltyTransactions/{transactionId} {
      allow read: if isOwner(resource.data.userId) || isSuperAdmin();
      allow write: if false; // solo functions
    }
  }
}
```

---

## 6. Cloud Functions Necesarias

### 6.1. Triggers Firestore

#### `onQueueCreate`
```typescript
// Trigger: onCreate /queue/{queueId}
// Propósito: Inicializar cola, calcular posición, notificar

exports.onQueueCreate = functions.firestore
  .document('queue/{queueId}')
  .onCreate(async (snap, context) => {
    const queue = snap.data();
    const { franchiseId, branchId, userId } = queue;

    // 1. Calcular posición
    const activeQueue = await getActiveQueue(franchiseId, branchId);
    const position = activeQueue.length + 1;

    // 2. Calcular tiempo estimado
    const avgServiceTime = await getAvgServiceTime(branchId);
    const estimatedWaitTime = (position - 1) * avgServiceTime;

    // 3. Actualizar documento
    await snap.ref.update({
      position,
      estimatedWaitTime,
      status: 'waiting'
    });

    // 4. Notificar cliente
    await sendNotification(userId, {
      title: 'En cola',
      body: `Estás en posición ${position}. Tiempo estimado: ${estimatedWaitTime} min`,
      data: { queueId: snap.id, type: 'queue_joined' }
    });

    // 5. Notificar barberos (topic)
    await sendToTopic(`branch-${branchId}-barbers`, {
      title: 'Nuevo en cola',
      body: `Cliente en posición ${position}`,
      data: { queueId: snap.id }
    });
  });
```

#### `onQueueUpdate`
```typescript
// Trigger: onUpdate /queue/{queueId}
// Propósito: Manejar cambios de status, timers

exports.onQueueUpdate = functions.firestore
  .document('queue/{queueId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Status cambió de 'waiting' → 'notified' (barbero llamó)
    if (before.status === 'waiting' && after.status === 'notified') {
      const timerExpiry = admin.firestore.Timestamp.fromMillis(
        Date.now() + 10 * 60 * 1000 // 10 min
      );

      await change.after.ref.update({ timerExpiry, notifiedAt: admin.firestore.FieldValue.serverTimestamp() });

      await sendNotification(after.userId, {
        title: '¡Tu turno!',
        body: 'Tienes 10 minutos para llegar',
        data: { queueId: context.params.queueId, type: 'queue_notified' }
      });
    }

    // Status cambió a 'arrived' (cliente llegó)
    if (after.status === 'arrived') {
      const timerExpiry = admin.firestore.Timestamp.fromMillis(
        Date.now() + 5 * 60 * 1000 // 5 min gracia
      );

      await change.after.ref.update({
        timerExpiry,
        arrivedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Notificar barbero
      await sendNotification(after.barberId, {
        title: 'Cliente llegó',
        body: `Cliente en recepción`,
        data: { queueId: context.params.queueId }
      });
    }

    // Status cambió a 'completed'
    if (after.status === 'completed') {
      // Actualizar stats barbero
      await updateBarberStats(after.barberId, after);

      // Dar puntos lealtad
      await addLoyaltyPoints(after.userId, after.franchiseId, after.serviceId);
    }

    // Status cambió a 'expired'
    if (after.status === 'expired') {
      await sendNotification(after.userId, {
        title: 'Turno expirado',
        body: 'No llegaste a tiempo. Vuelve a unirte a la cola si lo deseas.',
        data: { queueId: context.params.queueId, type: 'queue_expired' }
      });

      // Avanzar cola (siguiente cliente)
      await advanceQueue(after.franchiseId, after.branchId);
    }
  });
```

---

### 6.2. Scheduled Functions

#### `checkExpiredTimers`
```typescript
// Cada 1 minuto
exports.checkExpiredTimers = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();

    // Buscar documentos con timerExpiry vencido
    const expiredQueue = await admin.firestore()
      .collectionGroup('queue')
      .where('status', 'in', ['notified', 'arrived'])
      .where('timerExpiry', '<=', now)
      .get();

    // Batch update a 'expired'
    const batch = admin.firestore().batch();
    expiredQueue.docs.forEach(doc => {
      batch.update(doc.ref, { status: 'expired' });
    });

    await batch.commit();

    console.log(`Expired ${expiredQueue.size} queue entries`);
  });
```

---

### 6.3. HTTP Functions (Callable)

#### `joinQueue`
```typescript
// POST /queue/join
exports.joinQueue = functions.https.onCall(async (data, context) => {
  // 1. Verificar auth
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { branchId, serviceId } = data;
  const userId = context.auth.uid;

  // 2. Validar branch existe y está abierto
  const branch = await getBranch(branchId);
  if (!branch || !isOpenNow(branch)) {
    throw new functions.https.HttpsError('failed-precondition', 'Sucursal cerrada');
  }

  // 3. Verificar usuario no está en otra cola activa
  const activeQueue = await admin.firestore()
    .collectionGroup('queue')
    .where('userId', '==', userId)
    .where('status', 'in', ['waiting', 'notified', 'arrived', 'in_service'])
    .limit(1)
    .get();

  if (!activeQueue.empty) {
    throw new functions.https.HttpsError('already-exists', 'Ya estás en una cola');
  }

  // 4. Verificar capacidad
  const currentQueue = await getActiveQueue(branch.franchiseId, branchId);
  if (currentQueue.length >= branch.capacity.queueMax) {
    throw new functions.https.HttpsError('resource-exhausted', 'Cola llena');
  }

  // 5. Crear documento queue
  const queueRef = await admin.firestore().collection('queue').add({
    franchiseId: branch.franchiseId,
    branchId,
    userId,
    serviceId: serviceId || null,
    status: 'waiting',
    position: 0, // calculado en trigger
    estimatedWaitTime: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { queueId: queueRef.id };
});
```

---

## 7. Consideraciones de Rendimiento

### 7.1. Índices Compuestos

**Crear en Firebase Console o via `firestore.indexes.json`:**

```json
{
  "indexes": [
    {
      "collectionGroup": "queue",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "franchiseId", "order": "ASCENDING" },
        { "fieldPath": "branchId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "queue",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "timerExpiry", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### 7.2. TanStack Query Configuración

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 min (branches, services)
      cacheTime: 10 * 60 * 1000,      // 10 min
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Real-time data (queue): usar onSnapshot directo
useEffect(() => {
  const unsubscribe = onSnapshot(
    doc(db, 'queue', queueId),
    (snapshot) => {
      setQueueData(snapshot.data());
    }
  );

  return unsubscribe;
}, [queueId]);
```

---

## Resumen Ejecutivo

### Stack
React + TypeScript + Capacitor → Firebase (Firestore + Auth + Functions + FCM + Hosting)

### Multitenant
- `franchiseId` en todos los documentos (excepto `users`)
- Clientes globales, datos franquicia aislados
- Security Rules validan `franchiseId` via custom claims

### Modelo de Datos
9 colecciones principales, **`queue` es crítica (real-time)**. Índices compuestos para queries multi-tenant.

### Cloud Functions
- **Triggers**: onQueueCreate/Update (timers, notificaciones), onAppointmentCreate
- **Scheduled**: checkExpiredTimers (1 min), sendReminders (15 min), cleanup (diario)
- **HTTP**: joinQueue, bookAppointment, redeemLoyalty, admin API

### Rendimiento
- Índices compuestos obligatorios
- TanStack Query para caché
- Offline persistence habilitado
- Batch writes, paginación cursor-based
- Listeners limitados a queries (no docs individuales)

**Esta arquitectura escala a 500 franquicias, soporta real-time, multi-país, y es cost-effective en Firebase pricing.**
