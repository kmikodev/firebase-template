# Estrategia Completa de Notificaciones Push con FCM

## 1. Estrategia FCM: Notification vs Data Payloads

### Notification Payloads
**Cuándo usar:**
- Notificaciones simples que solo requieren mostrar mensaje
- Cuando la app está en background y queremos que Android/iOS manejen la UI automáticamente
- Casos de uso: confirmaciones, recordatorios básicos

**Limitaciones:**
- No se puede personalizar completamente la UI
- En iOS, si la app está en foreground, no se muestra automáticamente

### Data Payloads
**Cuándo usar:**
- Cuando necesitamos lógica custom al recibir (actualizar UI, navegar, etc.)
- Cuando la app debe procesar data incluso en background
- Notificaciones críticas que requieren acciones inmediatas

**Casos de uso:** "Es tu turno", actualizaciones de posición en cola

### Enfoque Híbrido (Recomendado)
Usar **notification + data** para máxima compatibilidad:

```typescript
// functions/src/notifications/types.ts
export interface FCMPayload {
  notification: {
    title: string;
    body: string;
    sound?: 'default' | 'critical';
    badge?: number;
  };
  data: {
    type: NotificationType;
    // Datos específicos según tipo
    [key: string]: string; // FCM data solo acepta strings
  };
  android: {
    priority: 'high' | 'normal';
    ttl: number; // en segundos
    notification: {
      channelId: string;
      clickAction?: string;
    };
  };
  apns: {
    headers: {
      'apns-priority': '5' | '10';
      'apns-expiration': string;
    };
    payload: {
      aps: {
        contentAvailable?: boolean;
        sound?: string;
      };
    };
  };
}

export enum NotificationType {
  // Cliente
  TICKET_CONFIRMED = 'ticket_confirmed',
  POSITION_UPDATE = 'position_update',
  YOUR_TURN = 'your_turn',
  TICKET_EXPIRED = 'ticket_expired',
  APPOINTMENT_REMINDER = 'appointment_reminder',

  // Peluquero
  NEW_CLIENT = 'new_client',
  CLIENT_ARRIVED = 'client_arrived',
  SHIFT_REMINDER = 'shift_reminder',

  // Admin
  DAILY_REPORT = 'daily_report',
  ALERT_NO_BARBERS = 'alert_no_barbers',
  ALERT_QUEUE_SATURATED = 'alert_queue_saturated',
}
```

### Prioridad y TTL por Tipo

```typescript
// functions/src/notifications/config.ts
export const NOTIFICATION_CONFIG: Record<NotificationType, {
  priority: 'high' | 'normal';
  ttl: number;
  sound: 'default' | 'critical';
  channelId: string;
}> = {
  // ALTA PRIORIDAD (time-sensitive)
  [NotificationType.YOUR_TURN]: {
    priority: 'high',
    ttl: 300, // 5 minutos
    sound: 'critical',
    channelId: 'critical_alerts',
  },
  [NotificationType.POSITION_UPDATE]: {
    priority: 'high',
    ttl: 180, // 3 minutos
    sound: 'default',
    channelId: 'queue_updates',
  },
  [NotificationType.NEW_CLIENT]: {
    priority: 'high',
    ttl: 600, // 10 minutos
    sound: 'default',
    channelId: 'barber_alerts',
  },

  // PRIORIDAD NORMAL (informativas)
  [NotificationType.TICKET_CONFIRMED]: {
    priority: 'normal',
    ttl: 3600, // 1 hora
    sound: 'default',
    channelId: 'general',
  },
  [NotificationType.APPOINTMENT_REMINDER]: {
    priority: 'normal',
    ttl: 7200, // 2 horas
    sound: 'default',
    channelId: 'reminders',
  },
  [NotificationType.DAILY_REPORT]: {
    priority: 'normal',
    ttl: 86400, // 24 horas
    sound: 'default',
    channelId: 'reports',
  },

  // ALERTAS ADMIN
  [NotificationType.ALERT_NO_BARBERS]: {
    priority: 'high',
    ttl: 1800, // 30 minutos
    sound: 'critical',
    channelId: 'admin_alerts',
  },
};
```

## 2. Arquitectura de Envío

### Desde Cloud Functions

```typescript
// functions/src/notifications/sender.ts
import * as admin from 'firebase-admin';
import { NOTIFICATION_CONFIG } from './config';
import { NotificationType } from './types';

export class NotificationSender {
  private messaging = admin.messaging();

  /**
   * Envía notificación a un usuario específico
   */
  async sendToUser(
    userId: string,
    type: NotificationType,
    data: Record<string, any>,
    notification: { title: string; body: string }
  ): Promise<void> {
    const tokens = await this.getUserTokens(userId);
    if (tokens.length === 0) {
      console.log(`No tokens for user ${userId}`);
      return;
    }

    const config = NOTIFICATION_CONFIG[type];
    const payload = this.buildPayload(type, data, notification, config);

    // Enviar a múltiples tokens (máx 500 por batch)
    const results = await this.messaging.sendEachForMulticast({
      tokens,
      ...payload,
    });

    // Limpiar tokens inválidos
    await this.cleanupInvalidTokens(userId, tokens, results);
  }

  /**
   * Envía notificación a un topic
   */
  async sendToTopic(
    topic: string,
    type: NotificationType,
    data: Record<string, any>,
    notification: { title: string; body: string }
  ): Promise<void> {
    const config = NOTIFICATION_CONFIG[type];
    const payload = this.buildPayload(type, data, notification, config);

    await this.messaging.send({
      topic,
      ...payload,
    });
  }

  private buildPayload(
    type: NotificationType,
    data: Record<string, any>,
    notification: { title: string; body: string },
    config: typeof NOTIFICATION_CONFIG[NotificationType]
  ) {
    // Convertir todos los valores a strings para FCM
    const dataStrings: Record<string, string> = {
      type,
      ...Object.entries(data).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: typeof value === 'string' ? value : JSON.stringify(value),
      }), {}),
    };

    return {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: dataStrings,
      android: {
        priority: config.priority,
        ttl: config.ttl * 1000, // milisegundos
        notification: {
          channelId: config.channelId,
          sound: config.sound,
        },
      },
      apns: {
        headers: {
          'apns-priority': config.priority === 'high' ? '10' : '5',
          'apns-expiration': String(Math.floor(Date.now() / 1000) + config.ttl),
        },
        payload: {
          aps: {
            sound: config.sound === 'critical' ? 'critical.wav' : 'default',
            contentAvailable: true,
          },
        },
      },
    };
  }

  private async getUserTokens(userId: string): Promise<string[]> {
    const tokensSnap = await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .where('active', '==', true)
      .get();

    return tokensSnap.docs.map(doc => doc.id);
  }

  private async cleanupInvalidTokens(
    userId: string,
    tokens: string[],
    results: admin.messaging.BatchResponse
  ): Promise<void> {
    const invalidTokens = results.responses
      .map((resp, idx) => resp.success ? null : tokens[idx])
      .filter(Boolean) as string[];

    if (invalidTokens.length === 0) return;

    const batch = admin.firestore().batch();
    invalidTokens.forEach(token => {
      const ref = admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('fcmTokens')
        .doc(token);
      batch.delete(ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${invalidTokens.length} invalid tokens for user ${userId}`);
  }
}
```

### Triggers para Cada Caso de Uso

```typescript
// functions/src/notifications/triggers.ts
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { NotificationSender } from './sender';

const sender = new NotificationSender();

/**
 * 1. Cliente saca turno → Confirmación
 */
export const onTicketCreated = onDocumentCreated(
  'tickets/{ticketId}',
  async (event) => {
    const ticket = event.data?.data();
    if (!ticket) return;

    await sender.sendToUser(
      ticket.userId,
      NotificationType.TICKET_CONFIRMED,
      {
        ticketId: event.params.ticketId,
        branchId: ticket.branchId,
        position: ticket.position,
      },
      {
        title: 'Turno confirmado',
        body: `Estás en posición ${ticket.position}. Te avisaremos cuando se acerque tu turno.`,
      }
    );

    // Notificar a peluqueros de la sucursal
    await sender.sendToTopic(
      `branch-${ticket.branchId}-barbers`,
      NotificationType.NEW_CLIENT,
      {
        ticketId: event.params.ticketId,
        clientName: ticket.clientName,
      },
      {
        title: 'Nuevo cliente en cola',
        body: `${ticket.clientName} acaba de sacar turno`,
      }
    );
  }
);

/**
 * 2. Actualización de posición en cola
 */
export const onTicketPositionUpdated = onDocumentUpdated(
  'tickets/{ticketId}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Solo si cambió la posición
    if (before.position === after.position) return;

    const newPosition = after.position;

    // "Faltan 3 personas" cuando llega a posición 4
    if (newPosition === 4) {
      await sender.sendToUser(
        after.userId,
        NotificationType.POSITION_UPDATE,
        {
          ticketId: event.params.ticketId,
          position: newPosition,
        },
        {
          title: 'Falta poco para tu turno',
          body: 'Faltan 3 personas. Te recomendamos acercarte a la sucursal.',
        }
      );
    }

    // "Falta 1 persona" cuando llega a posición 2
    if (newPosition === 2) {
      await sender.sendToUser(
        after.userId,
        NotificationType.POSITION_UPDATE,
        {
          ticketId: event.params.ticketId,
          position: newPosition,
        },
        {
          title: 'Ya casi es tu turno',
          body: 'Falta 1 persona. Prepárate para entrar.',
        }
      );
    }

    // "Es tu turno" cuando llega a posición 1
    if (newPosition === 1 && before.position > 1) {
      await sender.sendToUser(
        after.userId,
        NotificationType.YOUR_TURN,
        {
          ticketId: event.params.ticketId,
          branchId: after.branchId,
        },
        {
          title: '¡Es tu turno!',
          body: 'Acércate al mostrador. Tienes 5 minutos.',
        }
      );
    }
  }
);

/**
 * 3. Turno expirado/saltado
 */
export const onTicketExpired = onDocumentUpdated(
  'tickets/{ticketId}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    if (before.status !== 'expired' && after.status === 'expired') {
      await sender.sendToUser(
        after.userId,
        NotificationType.TICKET_EXPIRED,
        {
          ticketId: event.params.ticketId,
        },
        {
          title: 'Turno expirado',
          body: 'Tu turno fue saltado por no presentarte. Puedes sacar otro turno.',
        }
      );
    }
  }
);
```

## 3. Manejo de Tokens en Firestore

### Estructura de Datos

```typescript
// Firestore structure
users/{userId}/fcmTokens/{token}
{
  token: string;          // El token FCM (también es el doc ID)
  platform: 'ios' | 'android' | 'web';
  device: {
    model?: string;
    os?: string;
    appVersion?: string;
  };
  active: boolean;
  createdAt: Timestamp;
  lastUsedAt: Timestamp;
}

// También guardamos preferences
users/{userId}/notificationPreferences
{
  enabled: boolean;
  channels: {
    queueUpdates: boolean;
    reminders: boolean;
    promotions: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;  // "22:00"
    end: string;    // "08:00"
  };
}
```

### Cliente: Registrar Token

```typescript
// src/services/notifications.ts
import { getMessaging, getToken, deleteToken } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

export class NotificationService {
  private messaging = getMessaging();

  async requestPermission(): Promise<boolean> {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await this.registerToken();
      return true;
    }
    return false;
  }

  async registerToken(): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    const token = await getToken(this.messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    await setDoc(
      doc(db, `users/${currentUser.uid}/fcmTokens/${token}`),
      {
        token,
        platform: this.getPlatform(),
        device: {
          model: navigator.userAgent,
          appVersion: import.meta.env.VITE_APP_VERSION,
        },
        active: true,
        createdAt: serverTimestamp(),
        lastUsedAt: serverTimestamp(),
      }
    );

    console.log('FCM token registered:', token);
  }

  async unregisterToken(): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const token = await getToken(this.messaging);
    await deleteToken(this.messaging);

    await setDoc(
      doc(db, `users/${currentUser.uid}/fcmTokens/${token}`),
      { active: false, deletedAt: serverTimestamp() },
      { merge: true }
    );
  }

  private getPlatform(): 'ios' | 'android' | 'web' {
    // Capacitor
    if ((window as any).Capacitor) {
      return (window as any).Capacitor.getPlatform();
    }
    return 'web';
  }
}
```

## 4. Topics y Segmentación

### Estrategia de Topics

```typescript
// Topics structure:
// - branch-{branchId}-barbers     → Todos los peluqueros de una sucursal
// - branch-{branchId}-admins      → Admins de una sucursal
// - tenant-{tenantId}-admins      → Admins de un tenant
// - tenant-{tenantId}-all         → Todos los usuarios de un tenant
```

### Subscribir a Topics

```typescript
// functions/src/notifications/topics.ts
import * as admin from 'admin';

export async function subscribeUserToTopics(
  userId: string,
  role: 'client' | 'barber' | 'admin',
  branchId?: string,
  tenantId?: string
): Promise<void> {
  const tokens = await getUserTokens(userId);
  if (tokens.length === 0) return;

  const topics: string[] = [];

  // Peluqueros → topic de su sucursal
  if (role === 'barber' && branchId) {
    topics.push(`branch-${branchId}-barbers`);
  }

  // Admins → topics de sucursal y tenant
  if (role === 'admin') {
    if (branchId) topics.push(`branch-${branchId}-admins`);
    if (tenantId) topics.push(`tenant-${tenantId}-admins`);
  }

  // Subscribe a todos los topics
  for (const topic of topics) {
    await admin.messaging().subscribeToTopic(tokens, topic);
    console.log(`Subscribed ${userId} to topic ${topic}`);
  }
}
```

## 5. Plantillas de Notificaciones

```typescript
// functions/src/notifications/templates.ts
export const NOTIFICATION_TEMPLATES = {
  [NotificationType.TICKET_CONFIRMED]: (data: {
    position: number;
    branchName: string;
  }) => ({
    title: 'Turno confirmado ✓',
    body: `Estás en posición ${data.position} en ${data.branchName}`,
    deepLink: `/tickets/{ticketId}`,
  }),

  [NotificationType.POSITION_UPDATE]: (data: {
    position: number;
    peopleAhead: number;
  }) => ({
    title: data.peopleAhead <= 1 ? '¡Ya casi es tu turno!' : 'Actualización de turno',
    body: data.peopleAhead === 1
      ? 'Falta 1 persona. Prepárate para entrar.'
      : `Faltan ${data.peopleAhead} personas. Te recomendamos acercarte.`,
    deepLink: `/tickets/{ticketId}`,
  }),

  [NotificationType.YOUR_TURN]: () => ({
    title: '🔔 ¡Es tu turno!',
    body: 'Acércate al mostrador. Tienes 5 minutos.',
    deepLink: `/tickets/{ticketId}`,
  }),

  [NotificationType.TICKET_EXPIRED]: () => ({
    title: 'Turno expirado',
    body: 'Tu turno fue saltado. Puedes sacar otro turno cuando quieras.',
    deepLink: `/branches`,
  }),

  [NotificationType.APPOINTMENT_REMINDER]: (data: {
    scheduledFor: string;
    branchName: string;
  }) => ({
    title: 'Recordatorio de turno 📅',
    body: `Tienes turno mañana a las ${data.scheduledFor} en ${data.branchName}`,
    deepLink: `/appointments/{appointmentId}`,
  }),

  [NotificationType.NEW_CLIENT]: (data: {
    clientName: string;
    queueLength: number;
  }) => ({
    title: 'Nuevo cliente en cola',
    body: `${data.clientName} - Cola: ${data.queueLength} personas`,
    deepLink: `/barber/queue`,
  }),

  [NotificationType.DAILY_REPORT]: (data: {
    date: string;
    totalClients: number;
    revenue: number;
  }) => ({
    title: `Reporte diario - ${data.date}`,
    body: `${data.totalClients} clientes - $${data.revenue}`,
    deepLink: `/admin/reports/{reportId}`,
  }),

  [NotificationType.ALERT_NO_BARBERS]: (data: { branchName: string }) => ({
    title: '⚠️ Alerta: Sin peluqueros',
    body: `${data.branchName} no tiene peluqueros activos`,
    deepLink: `/admin/branches/{branchId}`,
  }),
};
```

## 6. Permisos y UX

### Estrategia de Solicitud de Permisos

```typescript
// src/components/NotificationOnboarding.tsx
import { useState, useEffect } from 'react';
import { NotificationService } from '@/services/notifications';

export function NotificationOnboarding() {
  const [show, setShow] = useState(false);
  const notificationService = new NotificationService();

  useEffect(() => {
    // Mostrar solo si:
    // 1. No ha respondido antes
    // 2. Ya está autenticado
    // 3. Ha usado la app al menos 1 vez
    const hasAsked = localStorage.getItem('notification-permission-asked');
    if (!hasAsked && auth.currentUser) {
      setShow(true);
    }
  }, []);

  const handleEnable = async () => {
    const granted = await notificationService.requestPermission();
    localStorage.setItem('notification-permission-asked', 'true');
    setShow(false);

    if (granted) {
      // Mostrar configuración granular
      router.push('/settings/notifications');
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm">
        <div className="text-6xl text-center mb-4">🔔</div>
        <h2 className="text-xl font-bold mb-2">No te pierdas tu turno</h2>
        <p className="text-gray-600 mb-4">
          Te avisaremos cuando se acerque tu turno, cuando llegue, y mucho más.
        </p>
        <div className="space-y-2">
          <button onClick={handleEnable} className="w-full btn-primary">
            Activar notificaciones
          </button>
          <button onClick={() => setShow(false)} className="w-full btn-secondary">
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
```

## 7. Testing

### Desarrollo Local

```typescript
// functions/src/notifications/test.ts
import { onRequest } from 'firebase-functions/v2/https';
import { NotificationSender } from './sender';

/**
 * Endpoint HTTP para testing (solo en desarrollo)
 */
export const testNotification = onRequest(async (req, res) => {
  if (process.env.FUNCTIONS_EMULATOR !== 'true') {
    res.status(403).send('Only available in emulator');
    return;
  }

  const { userId, type } = req.body;
  const sender = new NotificationSender();

  await sender.sendToUser(
    userId,
    type,
    { test: true },
    {
      title: 'Test notification',
      body: `Testing ${type}`,
    }
  );

  res.json({ success: true });
});
```

### Herramientas Recomendadas

1. **Firebase Console** - Composer de notificaciones para testing manual
2. **Postman/cURL** - Testing de endpoints HTTP
3. **Firebase Emulator Suite** - Testing de triggers localmente
4. **React DevTools** - Inspeccionar estado de permisos

---

## Resumen de Decisiones Arquitectónicas

1. **Payload híbrido** (notification + data) para máxima compatibilidad
2. **Tokens en subcollection** para escalabilidad y limpieza automática
3. **Topics para broadcast** (peluqueros, admins) vs **tokens directos** (clientes)
4. **Cloud Tasks para retry** de notificaciones críticas
5. **Configuración granular** con quiet hours y preferencias por canal
6. **Onboarding no intrusivo** después del primer uso
7. **Limpieza automática** de tokens inactivos (>90 días)
8. **Deep links** en todas las notificaciones para UX óptima
