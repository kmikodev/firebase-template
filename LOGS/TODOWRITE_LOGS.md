# 📋 TodoWrite Maestro: App Multitenant Peluquerías

## ✅ Decisiones Finales del Proyecto

### 💳 Pagos
- **Stripe** integrado (España - EUR)
- Pago presencial O digital (cliente elige)
- Webhooks para confirmación de pago

### 📱 Plataformas
- **Web:** React + Vite (dashboard admins + cliente web)
- **Mobile:** iOS + Android (Capacitor)
- **Todas las plataformas activas desde MVP**

### 🌍 Localización
- **País:** España
- **Moneda:** EUR (€)
- **Idioma:** Español (i18n preparado para multi-idioma futuro)
- **Zona horaria:** Europe/Madrid

---

## 🎯 Plan de Desarrollo: 10 Milestones (20 semanas / ~5 meses)

---

## 📋 MILESTONE 1: Configuración Base y Autenticación (2 semanas)

### Sprint 1.1: Setup Proyecto (Semana 1)
- [ ] Configurar proyecto Firebase (Firestore, Auth, Functions, Storage, Hosting)
- [ ] Configurar proyecto React + TypeScript + Vite
- [ ] Configurar Capacitor para iOS/Android
- [ ] Configurar TailwindCSS + componentes base
- [ ] Configurar estructura de carpetas (src/, functions/, capacitor/)

### Sprint 1.2: Autenticación (Semana 2)
- [ ] Implementar Firebase Auth con Google
- [ ] Implementar Guest mode (signInAnonymously)
- [ ] Crear modelo de datos Firestore (users, franchises, branches)
- [ ] Implementar Security Rules multitenancy básicas
- [ ] Crear Cloud Function onCreate user (custom claims)
- [ ] Tests autenticación + review (code-reviewer agent)
- [ ] Deploy staging milestone 1

**Entregables:**
- ✅ Login funcional (Google + Guest)
- ✅ Estructura base del proyecto
- ✅ Custom claims configurados

---

## 📋 MILESTONE 2: CRUD Roles y Gestión Básica (2 semanas)

### Sprint 2.1: CRUD Entidades (Semana 3)
- [ ] Implementar CRUD franquicias (Super Admin)
- [ ] Implementar CRUD sucursales (Franquiciado)
- [ ] Implementar CRUD peluqueros (Admin Sucursal)
- [ ] Implementar CRUD servicios (Admin Sucursal)

### Sprint 2.2: Dashboard Admin (Semana 4)
- [ ] Crear dashboard admin web (layout + navegación)
- [ ] Implementar asignación de roles y custom claims
- [ ] Security Rules para CRUD (validación por rol)
- [ ] Tests CRUD + review (code-reviewer agent)
- [ ] Deploy staging milestone 2

**Entregables:**
- ✅ Panel admin funcional
- ✅ Gestión de franquicias/sucursales/peluqueros/servicios
- ✅ Roles implementados

---

## 📋 MILESTONE 3: Sistema Turnos FIFO - Core (3 semanas)

### Sprint 3.1: Modelo de Datos Queue (Semana 5)
- [ ] Crear modelo de datos Queue y Tickets
- [ ] Implementar función canTakeTicket (validación límite 1-2)
- [ ] Implementar función takeTicket (transacción atómica)
- [ ] Crear índices compuestos Firestore para queries

### Sprint 3.2: Timers y Expiración (Semana 6)
- [ ] Implementar timers (10 min llegada, 5 min gracia)
- [ ] Implementar Cloud Function checkExpiredTickets (scheduled 1 min)
- [ ] Implementar funciones markArrival, callTicket, completeTicket
- [ ] Implementar avance de cola (advanceQueue)

### Sprint 3.3: Testing FIFO (Semana 7)
- [ ] Security Rules para Queue (solo functions write)
- [ ] Tests flujo FIFO completo + review (code-reviewer agent)
- [ ] Tests de casos edge (cola llena, simultáneo, etc.)
- [ ] Deploy staging milestone 3

**Entregables:**
- ✅ Sistema FIFO funcional
- ✅ Validación "máximo 1-2 antes"
- ✅ Timers automáticos

---

## 📋 MILESTONE 4: Sistema de Puntos y Penalizaciones (1 semana)

### Sprint 4.1: Puntos y Penalizaciones (Semana 8)
- [ ] Implementar modelo queuePoints y queuePenalties
- [ ] Implementar función applyPenalty (transaccional)
- [ ] Integrar penalizaciones en checkExpiredTickets
- [ ] Implementar bonificación en completeTicket (+1 punto)
- [ ] Implementar restricción canTakeTicket si puntos < 0
- [ ] Crear función admin restoreUserPoints
- [ ] Tests sistema puntos + review (code-reviewer agent)
- [ ] Deploy staging milestone 4

**Entregables:**
- ✅ Sistema de puntos funcional (+1, -10, -15, -5)
- ✅ Restricción por puntos negativos
- ✅ Admin puede restaurar puntos

---

## 📋 MILESTONE 5: Notificaciones Push FCM (2 semanas)

### Sprint 5.1: Configuración FCM (Semana 9)
- [ ] Configurar Firebase Cloud Messaging (FCM)
- [ ] Configurar VAPID keys (web push)
- [ ] Implementar NotificationSender class (sender.ts)
- [ ] Implementar registro de FCM tokens (frontend + Firestore)

### Sprint 5.2: Triggers y Plantillas (Semana 10)
- [ ] Implementar triggers onQueueCreate/Update (notificaciones)
- [ ] Implementar topics (branch-barbers, tenant-admins)
- [ ] Implementar plantillas de notificaciones
- [ ] Implementar cleanup de tokens inválidos
- [ ] Crear onboarding de permisos notificaciones (frontend)
- [ ] Tests notificaciones + review (code-reviewer agent)
- [ ] Deploy staging milestone 5

**Entregables:**
- ✅ Notificaciones push funcionales (iOS, Android, Web)
- ✅ Topics para broadcast
- ✅ Plantillas para todos los casos de uso

---

## 📋 MILESTONE 6: App Cliente Mobile + Web (3 semanas)

### Sprint 6.1: Diseño y Login (Semana 11)
- [ ] Diseñar UI/UX app cliente (Figma/wireframes)
- [ ] Implementar pantalla login (Google, Guest)
- [ ] Implementar upgrade guest → registered (linkWithPopup)
- [ ] Implementar pantalla búsqueda sucursales (geolocalización)

### Sprint 6.2: Flujo Sacar Turno (Semana 12)
- [ ] Implementar pantalla detalle sucursal (servicios, peluqueros)
- [ ] Implementar flujo sacar turno (elegir servicio, peluquero)
- [ ] Implementar pantalla mi turno (real-time listeners)
- [ ] Implementar countdown timers (10 min, 5 min)
- [ ] Implementar botón marcar llegada

### Sprint 6.3: Perfil y Historial (Semana 13)
- [ ] Implementar historial de turnos
- [ ] Implementar perfil usuario (puntos, penalizaciones)
- [ ] Configurar deep links para notificaciones
- [ ] Tests app cliente + review (qa-specialist agent)
- [ ] Build iOS/Android + deploy staging

**Entregables:**
- ✅ App cliente funcional (iOS, Android, Web)
- ✅ Flujo completo: buscar → sacar turno → recibir notificaciones

---

## 📋 MILESTONE 7: App Peluquero Mobile (2 semanas)

### Sprint 7.1: UI Peluquero (Semana 14)
- [ ] Diseñar UI/UX app peluquero (Figma/wireframes)
- [ ] Implementar pantalla login peluquero
- [ ] Implementar pantalla mi cola (real-time listeners)

### Sprint 7.2: Gestión Cola (Semana 15)
- [ ] Implementar botón llamar cliente (callTicket)
- [ ] Implementar botón marcar en atención
- [ ] Implementar botón completar servicio (completeTicket)
- [ ] Implementar gestión de descansos/pausas
- [ ] Implementar historial de servicios realizados
- [ ] Tests app peluquero + review (qa-specialist agent)
- [ ] Build iOS/Android + deploy staging

**Entregables:**
- ✅ App peluquero funcional (iOS, Android)
- ✅ Gestión completa de cola en tiempo real

---

## 📋 MILESTONE 8: Dashboard Admin Web (2 semanas)

### Sprint 8.1: Dashboard Franquiciado (Semana 16)
- [ ] Mejorar layout dashboard (sidebar, navegación)
- [ ] Implementar dashboard franquiciado (todas sus sucursales)
- [ ] Implementar vista de cola en vivo (admin)
- [ ] Implementar reportes básicos (turnos/día, peluqueros)

### Sprint 8.2: Dashboard Admin Sucursal (Semana 17)
- [ ] Implementar dashboard admin sucursal (gestión peluqueros, servicios)
- [ ] Implementar configuración horarios sucursal
- [ ] Implementar configuración límite de cola
- [ ] Tests dashboard + review (code-reviewer agent)
- [ ] Deploy staging milestone 8

**Entregables:**
- ✅ Dashboard completo para admins
- ✅ Reportes básicos
- ✅ Configuración sucursales

---

## 📋 MILESTONE 9: Integración Stripe Pagos (2 semanas) ⭐ NUEVO

### Sprint 9.1: Backend Stripe (Semana 18)
- [ ] Configurar cuenta Stripe España (EUR)
- [ ] Implementar Cloud Function createPaymentIntent
- [ ] Implementar webhook Stripe (stripe signature verification)
- [ ] Implementar modelo payments en Firestore
- [ ] Implementar flujo pago presencial (registro en Firestore)
- [ ] Security audit pagos (security-auditor agent)

### Sprint 9.2: Frontend Pagos (Semana 18)
- [ ] Integrar Stripe.js en frontend
- [ ] Implementar pantalla selección método pago (presencial/digital)
- [ ] Implementar flujo pago digital (Stripe Checkout)
- [ ] Implementar confirmación de pago y receipt
- [ ] Tests flujo pagos + review (code-reviewer agent)
- [ ] Deploy staging milestone 9

**Entregables:**
- ✅ Pagos Stripe funcionales (EUR)
- ✅ Opción presencial O digital
- ✅ Webhooks configurados

---

## 📋 MILESTONE 10: Testing End-to-End y QA (2 semanas)

### Sprint 10.1: Testing Completo (Semana 19)
- [ ] Crear plan de testing completo (qa-specialist agent)
- [ ] Tests E2E flujo cliente (sacar turno → completar)
- [ ] Tests E2E flujo peluquero (atender cola)
- [ ] Tests E2E flujo admin (gestión sucursal)
- [ ] Tests E2E flujo pagos (Stripe)
- [ ] Tests de penalizaciones (no-show, expiración)
- [ ] Tests de notificaciones push (todos los casos)
- [ ] Tests de casos edge (cola llena, sucursal cierra, etc.)

### Sprint 10.2: Performance y Seguridad (Semana 19)
- [ ] Tests de carga/performance (simular 100 usuarios)
- [ ] Auditoría de seguridad completa (security-auditor agent)
- [ ] Auditoría Stripe PCI compliance (security-auditor agent)
- [ ] Fixing de bugs encontrados
- [ ] Code review final (code-reviewer agent)

**Entregables:**
- ✅ Todos los flujos testeados
- ✅ Auditoría de seguridad aprobada
- ✅ Performance validado

---

## 📋 MILESTONE 11: Documentación y Deploy Producción (1 semana) ⭐ FINAL

### Sprint 11.1: Documentación (Semana 20)
- [ ] Crear documentación técnica API (Cloud Functions)
- [ ] Crear documentación usuario final (cliente, peluquero, admin)
- [ ] Crear guía de onboarding para franquicias
- [ ] Configurar Firebase Analytics y Crashlytics
- [ ] Configurar monitoreo y alertas (Cloud Logging)
- [ ] Crear plan de rollback (en caso de problemas)

### Sprint 11.2: Deploy Producción (Semana 20)
- [ ] Deploy producción (hosting, functions, rules)
- [ ] Publicar apps en App Store (España)
- [ ] Publicar apps en Google Play (España)
- [ ] Configurar dominio custom (ej: app.peluquerias.es)
- [ ] Monitoreo intensivo primeras 24h
- [ ] Retrospectiva y cierre de proyecto

**Entregables:**
- ✅ App en producción (Web + iOS + Android)
- ✅ Documentación completa
- ✅ Monitoreo activo

---

## 📊 Resumen del Plan

| Milestone | Duración | Semanas | Entregable Principal |
|-----------|----------|---------|----------------------|
| M1: Base + Auth | 2 semanas | 1-2 | Login funcional |
| M2: CRUD Roles | 2 semanas | 3-4 | Panel admin |
| M3: FIFO Core | 3 semanas | 5-7 | Sistema turnos |
| M4: Puntos | 1 semana | 8 | Penalizaciones |
| M5: FCM | 2 semanas | 9-10 | Push notifications |
| M6: App Cliente | 3 semanas | 11-13 | App móvil cliente |
| M7: App Peluquero | 2 semanas | 14-15 | App móvil peluquero |
| M8: Dashboard | 2 semanas | 16-17 | Dashboard completo |
| M9: Stripe | 2 semanas | 18 | Pagos integrados |
| M10: Testing | 2 semanas | 19 | QA completo |
| M11: Deploy | 1 semana | 20 | Producción |

**Total: 20 semanas (~5 meses)**

---

## 🚀 Próximos Pasos Inmediatos

### Ahora Mismo:
1. ✅ Revisar y aprobar este plan
2. ✅ Confirmar presupuesto y recursos
3. ✅ Configurar herramientas (Figma, Jira, GitHub)

### Esta Semana:
1. Crear proyecto Firebase
2. Configurar repositorio Git
3. Iniciar Milestone 1 (configuración base)

### Próxima Semana:
1. Implementar autenticación completa
2. Deploy staging primera versión
3. Iniciar Milestone 2 (CRUD)

---

## 📝 Notas Importantes

### Decisiones Tomadas:
- ✅ **Pagos:** Stripe (EUR, España)
- ✅ **Plataformas:** Web + iOS + Android (todas)
- ✅ **País:** España
- ✅ **Moneda:** EUR (€)

### Riesgos Identificados:
- ⚠️ Complejidad timers en Cloud Functions (mitigado con scheduled functions)
- ⚠️ Real-time listeners escalabilidad (mitigado con índices compuestos)
- ⚠️ Pagos Stripe (mitigado con security audits múltiples)

### Dependencias Críticas:
- Firebase proyecto creado ✅
- Cuenta Stripe España (crear en Milestone 9)
- Certificados iOS/Android (crear en Milestone 6)

---

## 🎯 Criterios de Éxito

### MVP Completo:
- [ ] 5 roles funcionando (Super Admin, Franquiciado, Admin, Peluquero, Cliente)
- [ ] Sistema FIFO con límite 1-2 turnos
- [ ] Timers automáticos (10 min, 5 min)
- [ ] Notificaciones push en tiempo real
- [ ] Pagos Stripe integrados
- [ ] Apps publicadas (iOS, Android, Web)

### Performance:
- [ ] < 2s carga inicial app
- [ ] < 500ms respuesta Cloud Functions
- [ ] 99.9% uptime primeros 30 días

### Seguridad:
- [ ] Auditoría completa aprobada
- [ ] PCI compliance (Stripe)
- [ ] Security Rules validadas

---

**Plan aprobado y listo para ejecutar** ✅

**Fecha inicio:** [Definir]
**Fecha estimada producción:** [Inicio + 20 semanas]
