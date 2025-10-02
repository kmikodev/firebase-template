# App Multitenant Peluquerías - Resumen Ejecutivo

## 📋 Índice de Documentación

Este análisis completo consta de 5 documentos:

1. **00-RESUMEN-EJECUTIVO.md** ← Este documento
2. **01-REQUERIMIENTOS.md** - User Stories, Casos de Uso, Matriz de Permisos, Reglas de Negocio
3. **02-ARQUITECTURA-TECNICA.md** - Stack, Modelo de Datos Firestore, Cloud Functions, Security Rules
4. **03-NOTIFICACIONES-PUSH.md** - FCM, Topics, Plantillas, Testing
5. **04-FLUJO-FIFO-Y-SOCIAL-LOGIN.md** - Lógica turnos, Timers, Sistema puntos, Social Auth

---

## 🎯 Visión General del Proyecto

### Concepto
App multitenant para peluquerías franquiciadas con **sistema de turnos FIFO** (no citas). Los clientes sacan turno desde la app antes de llegar, reciben notificaciones en tiempo real sobre su posición en cola.

### Características Principales
- **Multitenant:** Múltiples franquicias independientes, clientes globales compartidos
- **Turnos FIFO:** Cola virtual con límite de anticipación (máx 1-2 turnos antes)
- **Notificaciones Push:** Actualizaciones en tiempo real (FCM)
- **Social Login:** Google, Facebook, Apple + Guest mode
- **Sistema de Puntos:** Penalizaciones por no-show, bonificaciones por completar
- **Multi-plataforma:** iOS, Android (Capacitor), Web (dashboard admins)

---

## 👥 Roles y Usuarios

### Roles del Sistema

| Rol | Descripción | Plataforma |
|-----|-------------|------------|
| **Super Admin** | Gestiona plataforma global, todas las franquicias | Dashboard Web |
| **Franquiciado** | Dueño de franquicia, gestiona sus sucursales | Dashboard Web/Mobile |
| **Admin Sucursal** | Gestiona una sucursal específica | Dashboard Web/Mobile |
| **Peluquero** | Atiende turnos, gestiona su cola | App Mobile |
| **Cliente** | Saca turnos, recibe servicios | App Mobile |

### Matriz de Permisos (Resumen)

| Acción | Super Admin | Franquiciado | Admin Sucursal | Peluquero | Cliente |
|--------|:-----------:|:------------:|:--------------:|:---------:|:-------:|
| Crear franquicias | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gestionar sucursales | ✅ | ✅ | ✅ (suya) | ❌ | ❌ |
| Gestionar peluqueros | ✅ | ✅ | ✅ | ❌ | ❌ |
| Sacar turno | ❌ | ❌ | ❌ | ❌ | ✅ |
| Atender turno | ❌ | ❌ | ❌ | ✅ | ❌ |
| Ver reportes franquicia | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

```
Frontend:
├── React 18 + TypeScript + Vite
├── Capacitor 6 (iOS/Android nativo)
├── Tailwind CSS (diseño responsive)
├── TanStack Query (caché, state server)
└── Zustand (state local UI)

Backend:
├── Firebase Cloud Functions Gen 2 (Node 20 + TypeScript)
├── Firestore (base de datos real-time)
├── Firebase Auth (social login + custom claims)
├── Firebase Cloud Messaging (push notifications)
├── Firebase Storage (imágenes)
└── Firebase Hosting (PWA + CDN)
```

### Modelo de Datos Firestore (9 Colecciones)

```
/users (global)                    → Clientes + Staff, puntos lealtad
/franchises                        → Franquicias (tenants)
/branches                          → Sucursales (franchiseId)
/barbers                           → Peluqueros (franchiseId + branchId)
/services                          → Servicios con duración/precio
/queue (real-time) ⭐              → Cola FIFO en vivo
/appointments                      → Turnos programados (no FIFO)
/notifications                     → Log notificaciones enviadas
/loyaltyTransactions               → Historial puntos
```

**⭐ Colección crítica:** `/queue` - Real-time listeners, timers, índices compuestos

### Estrategia Multitenant

- **Tenant ID = franchiseId** en cada documento (excepto `users`, `franchises`)
- **Clientes globales:** Mismo user_id en todas franquicias, puntos compartidos
- **Datos aislados:** Sucursales, peluqueros, servicios filtrados por `franchiseId`
- **Security Rules:** Validan acceso vía custom claims (`role`, `franchiseId`)

---

## ⏱️ Sistema de Turnos FIFO

### Flujo Completo

```
1. Cliente verifica si puede sacar turno
   └─ Límite: máximo 1-2 personas antes que él
   └─ Si cola llena o restricción de puntos → Error

2. Cliente saca turno (transacción atómica)
   └─ Timer 10 min inicia → Debe llegar al local
   └─ Notificación: "Turno confirmado, posición #X"

3. Cliente llega físicamente y marca llegada
   └─ Timer se detiene
   └─ Entra en espera activa

4. Peluquero llama al siguiente cliente
   └─ Timer 5 min gracia inicia → Debe presentarse
   └─ Notificación: "¡Es tu turno! Tienes 5 min"

5. Cliente se presenta y es atendido
   └─ Al finalizar → +1 punto lealtad
   └─ Cola avanza automáticamente

6. Si NO llega/presenta → Penalización automática
   └─ Scheduled function (cada 1 min) detecta expiración
   └─ -10 puntos (no llegada) o -15 puntos (no-show)
```

### Sistema de Puntos

| Acción | Puntos | Consecuencia |
|--------|:------:|--------------|
| Completar turno | **+1** | - |
| No llegar (10 min) | **-10** | Turno cancelado |
| No presentarse (5 min) | **-15** | Saltado en cola |
| Cancelar tarde (<1h) | **-5** | - |
| **Puntos < 0** | - | **Bloqueado temporalmente** |

### Lógica "Máximo 1-2 Turnos Antes"

```typescript
// Validación antes de asignar turno
const MAX_ADVANCE_TICKETS = 2;
const nextNumber = queue.lastAssignedNumber + 1;
const currentNumber = queue.currentNumber;

if (nextNumber - currentNumber > MAX_ADVANCE_TICKETS) {
  return { error: "Cola llena, intenta más tarde" };
}
```

**Ejemplo:**
- Cola actual: turno #10
- Último asignado: #11
- Próximo disponible: #12
- ¿Puede sacar turno? **Sí** (12 - 10 = 2 ≤ 2)
- Si fuera #13: **No** (13 - 10 = 3 > 2)

---

## 🔔 Notificaciones Push

### Estrategia FCM

**Payload Híbrido:** `notification` + `data` para máxima compatibilidad

**Tipos de Notificaciones:**

| Tipo | Prioridad | TTL | Canal |
|------|-----------|-----|-------|
| **Tu turno** | Alta | 5 min | critical_alerts |
| **Actualización posición** | Alta | 3 min | queue_updates |
| **Nuevo cliente (peluquero)** | Alta | 10 min | barber_alerts |
| **Confirmación turno** | Normal | 1h | general |
| **Recordatorio appointment** | Normal | 2h | reminders |

### Topics vs Tokens

- **Topics:** Broadcast a grupos (ej: `branch-{branchId}-barbers`)
- **Tokens Directos:** Notificaciones personalizadas a clientes

### Casos de Uso

**Cliente:**
1. Confirmación al sacar turno
2. "Faltan 3 personas..." (posición 4)
3. "Falta 1 persona..." (posición 2)
4. "¡Es tu turno!" (posición 1)
5. "Turno expirado" (penalización)

**Peluquero:**
1. Nuevo cliente en cola
2. Cliente llegó a sucursal
3. Recordatorios de horarios

**Admin:**
1. Reportes diarios/semanales
2. Alertas (sucursal sin barberos, cola saturada)

---

## 🔐 Autenticación y Seguridad

### Social Login (Firebase Auth)

**Proveedores:**
- **Google** (OAuth 2.0)
- **Facebook** (OAuth 2.0)
- **Apple** (Sign in with Apple)
- **Guest Mode** (anónimo, upgradeable)

### Custom Claims

```typescript
interface CustomClaims {
  role: 'client' | 'barber' | 'admin' | 'franchise_admin';
  isAnonymous: boolean;
  franchiseId?: string;  // Para staff de franquicia
  branchId?: string;     // Para peluqueros
}
```

### Guest Mode

- Usuario anónimo puede sacar turno
- Al registrarse (Google/Facebook/Apple), **migra historial automáticamente**
- Función `linkWithPopup()` para upgrade sin pérdida de datos

### Security Rules (Firestore)

```javascript
// Ejemplo: Solo dueño o admins pueden leer/escribir usuarios
match /users/{userId} {
  allow read: if isOwner(userId) || hasRole('admin');
  allow write: if isOwner(userId) || hasRole('admin');
}

// Ejemplo: Solo peluqueros/admins pueden actualizar turnos
match /queue/{queueId} {
  allow read: if isAuthenticated();
  allow write: if false; // Solo Cloud Functions (validaciones complejas)
}
```

---

## 🚀 Cloud Functions (Serverless)

### Triggers Firestore

| Trigger | Evento | Acción |
|---------|--------|--------|
| **onQueueCreate** | Nuevo turno sacado | Calcular posición, iniciar timer 10 min, notificar |
| **onQueueUpdate** | Cambio de status | Manejar transiciones (waiting → called → completed) |
| **onAppointmentCreate** | Nuevo appointment | Verificar disponibilidad, reservar slot |
| **onUserCreate** | Nuevo usuario | Crear doc Firestore, asignar custom claims |

### Scheduled Functions

| Función | Frecuencia | Acción |
|---------|------------|--------|
| **checkExpiredTimers** | Cada 1 min | Buscar turnos expirados, aplicar penalizaciones |
| **sendAppointmentReminders** | Cada 15 min | Notificar turnos próximos (1h antes) |
| **cleanupOldRecords** | Diario (2 AM) | Eliminar turnos >30 días |
| **sendDailyReports** | Diario (6 AM) | Reportes a admins/franquiciados |

### HTTP Functions (Callable)

| Endpoint | Método | Acción |
|----------|--------|--------|
| **/queue/join** | POST | Validar y crear turno (con retry logic) |
| **/appointment/book** | POST | Reservar turno programado |
| **/loyalty/redeem** | POST | Canjear puntos (transacción atómica) |
| **/admin/reports** | GET | Generar métricas y reportes |

---

## 📊 Escalabilidad y Rendimiento

### Métricas Objetivo

| Métrica | Año 1 | Año 3 |
|---------|-------|-------|
| Franquicias | 100 | 500 |
| Sucursales | ~500 (5/franquicia) | ~2,500 |
| Usuarios activos/día | ~10,000 | ~50,000 |
| Turnos/día | ~5,000 | ~25,000 |

### Optimizaciones

1. **Índices Compuestos:**
   ```javascript
   queue: [franchiseId, branchId, status, createdAt]
   queue: [status, timerExpiry]  // Para scheduled function
   appointments: [franchiseId, barberId, dateTime]
   ```

2. **Caché Frontend (TanStack Query):**
   - Sucursales/servicios: staleTime 5 min
   - Datos estáticos: caché 10 min
   - Cola en tiempo real: `onSnapshot()` directo

3. **Offline Persistence:**
   - Firestore SDK v9+: automático (IndexedDB, 50 MB)
   - UI: indicador "pendiente de sincronización"

4. **Batch Writes:**
   ```typescript
   // Avanzar cola: actualizar múltiples docs en 1 operación
   const batch = db.batch();
   queueDocs.forEach(doc => batch.update(doc.ref, { position: newPosition }));
   await batch.commit();
   ```

5. **Cloud Functions Warm Instances:**
   ```typescript
   functions.runWith({ minInstances: 1 }) // Evitar cold start
   ```

---

## 💰 Costos Estimados (Firebase)

### Año 1 (100 franquicias, ~500 sucursales)

**Firestore:**
- Lecturas: ~10M/mes (real-time listeners) → **$60/mes**
- Escrituras: ~2M/mes (turnos, actualizaciones) → **$36/mes**
- Storage: ~10 GB → **$2/mes**

**Cloud Functions:**
- Invocaciones: ~5M/mes → **$20/mes**
- Compute time: ~100 GB-sec → **$18/mes**

**FCM (Notificaciones):**
- Push notifications: **Gratis** (ilimitadas)

**Firebase Auth:**
- Usuarios activos: **Gratis** hasta 50K

**Total estimado:** **~$136/mes** → **$1,632/año**

### Año 3 (500 franquicias, ~2,500 sucursales)

**Total estimado:** **~$680/mes** → **$8,160/año**

---

## 🛠️ Plan de Implementación (MVP)

### Fase 1: Fundamentos (2-3 semanas)
- [ ] Configurar proyecto Firebase
- [ ] Implementar autenticación (Google, guest mode)
- [ ] Crear modelo de datos Firestore
- [ ] Security Rules básicas
- [ ] CRUD usuarios y roles

### Fase 2: Core Features (3-4 semanas)
- [ ] Sistema turnos FIFO (lógica completa)
- [ ] Timers (10 min llegada, 5 min gracia)
- [ ] Sistema de puntos y penalizaciones
- [ ] Notificaciones push básicas (confirmación, tu turno)
- [ ] Real-time listeners (cola en vivo)

### Fase 3: UI/UX (2-3 semanas)
- [ ] App cliente (React + Capacitor)
- [ ] App peluquero (gestión cola)
- [ ] Dashboard admin (web)
- [ ] Onboarding notificaciones
- [ ] Gestión sucursales y servicios

### Fase 4: Testing y Deploy (1-2 semanas)
- [ ] Tests unitarios (Cloud Functions)
- [ ] Tests integración (flujo completo FIFO)
- [ ] Testing mobile (iOS/Android)
- [ ] Deploy staging
- [ ] Deploy producción

**Total estimado: 8-12 semanas (2-3 meses)**

---

## ✅ Features MVP vs v2

### ✅ MVP (Incluir)
- CRUD usuarios (5 roles)
- Turnos FIFO con límite 1-2 antes
- Timers automáticos (10 min, 5 min)
- Sistema de puntos básico
- Notificaciones push críticas
- Social login (Google, guest)
- Dashboard admins (web)
- App móvil peluqueros
- Multitenant funcional

### ❌ v2 (Futuro)
- Facebook/Apple login
- Pagos digitales (Stripe)
- Reportes avanzados (analytics)
- Multi-idioma (i18n)
- Integraciones externas (CRM)
- Programa de lealtad (recompensas)
- Citas programadas (no FIFO)
- Marketing automation

---

## 🚨 Decisiones Pendientes

### Críticas (Decidir ANTES de codear):

1. **Pagos:**
   - ¿Digital (Stripe/MercadoPago) o presencial?
   - ¿Pago al sacar turno o al finalizar servicio?
   - ¿Propina digital para peluqueros?

2. **Plataformas:**
   - ¿App cliente web o SOLO mobile?
   - ¿Dashboard admin responsive o desktop-only?

3. **Localización:**
   - ¿Multi-país desde MVP o solo Argentina?
   - ¿Multi-idioma o solo español?
   - ¿Zonas horarias múltiples?

### Recomendaciones:

**Pagos:** Presencial en MVP, digital en v2
**Plataformas:** Solo mobile (iOS/Android) + dashboard web responsive
**Localización:** Solo Argentina + español en MVP, multi-país en v2

---

## 📞 Próximos Pasos

1. **Revisar esta documentación completa** (5 documentos en `./LOGS`)
2. **Decidir sobre pendientes** (pagos, plataformas, localización)
3. **Aprobar arquitectura** o solicitar ajustes
4. **Iniciar implementación** siguiendo el plan de 8-12 semanas

**¿Listo para empezar a codear?** 🚀

---

## 📚 Documentación Completa

- **[01-REQUERIMIENTOS.md](./01-REQUERIMIENTOS.md)** - Análisis funcional detallado
- **[02-ARQUITECTURA-TECNICA.md](./02-ARQUITECTURA-TECNICA.md)** - Stack, Firestore, Functions, Rules
- **[03-NOTIFICACIONES-PUSH.md](./03-NOTIFICACIONES-PUSH.md)** - FCM estrategia completa
- **[04-FLUJO-FIFO-Y-SOCIAL-LOGIN.md](./04-FLUJO-FIFO-Y-SOCIAL-LOGIN.md)** - Código TypeScript detallado

**Total:** ~45,000 palabras de análisis y diseño técnico 📖
