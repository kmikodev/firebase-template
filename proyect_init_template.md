Perfecto! Te voy a explicar exactamente cómo interactuar con Claude Code para planificar tu aplicación de peluquerías antes de empezar a codear.

  🎯 Proceso Recomendado: Planificación → Diseño → Desarrollo

  1️⃣ Fase de Descubrimiento (Sin Agentes Todavía)

  Empieza con una conversación natural con Claude Code:

  Tú: "Quiero desarrollar una aplicación multitenant de peluquerías franquiciadas.
  La idea es:
  - Múltiples franquicias (tenants)
  - Cada franquicia tiene sucursales
  - Cada sucursal tiene peluqueros con horarios
  - Sistema de turnos FIFO (no citas)
  - Notificaciones push
  - Social login (Google, Facebook, Apple)

  Necesito que me ayudes a planificar y diseñar todo ANTES de empezar a codear.
  ¿Qué información necesitas de mí para hacer un buen análisis?"

  Claude Code te hará preguntas como:
  - ¿Quiénes son los usuarios? (dueños de franquicia, gerentes de sucursal, peluqueros, clientes)
  - ¿Cómo funciona el sistema de turnos exactamente?
  - ¿Necesitas pagos? ¿Subscripciones?
  - ¿Qué tipo de notificaciones? (turno listo, cancelaciones, recordatorios)
  - ¿Necesitas reportes/analytics?
  - etc.

  2️⃣ Fase de Análisis de Requisitos (Usar Agent)

  Una vez tengas clara la idea, pide explícitamente el análisis:

  Tú: "Usa el requirements-analyst agent para analizar estos requisitos
  y crear un documento completo de especificaciones técnicas"

  El agent creará:
  - User stories completas
  - Casos de uso
  - Requisitos funcionales y no funcionales
  - Restricciones técnicas
  - Priorización de features (MVP vs future)

  3️⃣ Fase de Arquitectura (Usar Agent)

  Con los requisitos claros:

  Tú: "Usa el firebase-architect agent para diseñar:
  1. Modelo de datos de Firestore (colecciones, documentos, relaciones)
  2. Security rules para el sistema multitenant
  3. Arquitectura de Cloud Functions necesarias
  4. Estrategia de notificaciones push
  5. Flujo de autenticación con social login"

  El agent diseñará:
  - Estructura completa de Firestore
  - Security rules que aíslen tenants
  - Diagrama de funciones serverless
  - Índices compuestos necesarios
  - Estrategia de escalabilidad

  4️⃣ Fase de Investigación Técnica (Si Es Necesario)

  Para tecnologías específicas:

  Tú: "Usa el tech-researcher agent para investigar:
  1. Mejores prácticas para notificaciones push en Capacitor
  2. Librerías recomendadas para social login con Firebase
  3. Estrategias de queue/turnos FIFO en Firestore
  4. Cómo implementar multitenancy seguro en Firebase"

  El agent investigará:
  - Librerías recomendadas
  - Ejemplos de código
  - Best practices
  - Comparación de enfoques

  5️⃣ Fase de Planificación de Desarrollo (TodoWrite Maestro)

  Ahora sí, planifica TODO el desarrollo:

  Tú: "Basándote en todo el análisis anterior, crea un TodoWrite MAESTRO
  con TODAS las fases de desarrollo desde el MVP hasta producción.
  Organízalo por sprints/milestones."

  Claude Code creará algo como:

  📋 TodoWrite Maestro: App Peluquerías

  ## Milestone 1: MVP - Sistema de Autenticación y Estructura Base (2 semanas)
  1. ⏳ Configurar Firebase Auth con social providers
  2. ⏳ Implementar data model básico (franchises, branches, users)
  3. ⏳ Crear security rules multitenancy
  4. ⏳ Implementar registro de franquicia/sucursal
  5. ⏳ Tests + review + deploy staging

  ## Milestone 2: Sistema de Turnos FIFO (2 semanas)
  6. ⏳ Diseñar sistema de cola en Firestore
  7. ⏳ Implementar lógica de asignación de turnos
  8. ⏳ Crear UI de gestión de turnos
  9. ⏳ Tests + review + deploy staging

  ## Milestone 3: Notificaciones Push (1 semana)
  10. ⏳ Configurar Firebase Cloud Messaging
  11. ⏳ Implementar triggers para notificaciones
  12. ⏳ Integrar con Capacitor Push Notifications
  13. ⏳ Tests + review + deploy staging

  [... etc ...]

  ---
  💡 Ejemplo Completo de Conversación

  Te muestro cómo sería una conversación real:

  Inicio (Tú):

  "Hola Claude! Estoy en el directorio de mi proyecto Firebase.

  Quiero desarrollar una aplicación de peluquerías con estas características:
  - Multitenant: Varias franquicias independientes
  - Cada franquicia tiene múltiples sucursales
  - Cada sucursal tiene peluqueros con horarios configurables
  - Sistema de turnos FIFO (no citas agendadas)
  - Notificaciones push cuando sea tu turno
  - Login social (Google, Facebook, Apple)
  - App móvil con Capacitor

  No quiero empezar a codear todavía. Primero necesito que me ayudes a:
  1. Analizar y refinar los requisitos
  2. Diseñar la arquitectura completa
  3. Crear un plan de desarrollo por fases

  ¿Qué información adicional necesitas?"

  Claude Code Responde:

  Perfecto! Voy a ayudarte a planificar completamente antes de codear.

  Déjame hacerte algunas preguntas para entender mejor:

  **Usuarios y Roles:**
  1. ¿Quiénes pueden crear franquicias? ¿Es un proceso de registro o necesita aprobación?
  2. ¿Los roles son: Super Admin, Dueño Franquicia, Gerente Sucursal, Peluquero, Cliente?
  3. ¿Un peluquero puede trabajar en múltiples sucursales?

  **Sistema de Turnos:**
  4. ¿Cómo funciona el turno? ¿El cliente llega y se agrega a la cola automáticamente?
  5. ¿Puede el cliente reservar su lugar en la cola antes de llegar?
  6. ¿Qué pasa si el cliente no llega cuando es su turno?
  7. ¿Los turnos son por peluquero específico o por sucursal?

  **Pagos:**
  8. ¿Necesitas procesar pagos en la app o es solo gestión de turnos?
  9. ¿Subscripción para las franquicias/sucursales?

  **Notificaciones:**
  10. ¿Qué eventos generan notificaciones? (turno cercano, turno listo, cancelaciones)

  Responde estas preguntas y luego empezaremos con el análisis formal usando los agents.

  Tú Respondes:

  Respuestas:
  1. Registro abierto pero con validación de email corporativo
  2. Sí, exactamente esos roles
  3. Sí, un peluquero puede estar en varias sucursales
  4. El cliente escanea QR en la sucursal o se registra desde la app
  5. Sí, puede reservar con geolocalización (debe estar cerca)
  6. Pierde el turno y va al final
  7. Turnos por peluquero específico
  8. Pagos sí, integración con Stripe
  9. Sí, subscripción mensual por sucursal
  10. Notificaciones: "Faltan 3 turnos", "Es tu turno", "Turno cancelado"

  Ahora sí, empieza el análisis formal.

  Claude Code Usa Agents:

  Perfecto! Ahora voy a usar los agents especializados para el análisis completo.

  > Use the requirements-analyst agent to create comprehensive requirements
    document for a multitenant hair salon app with the specifications provided...

  El agent generará un documento completo:
  # Análisis de Requisitos: App Peluquerías Multitenant

  ## 1. Resumen Ejecutivo
  [...]

  ## 2. Stakeholders
  - Dueños de franquicia
  - Gerentes de sucursal
  - Peluqueros
  - Clientes

  ## 3. User Stories

  ### Dueño de Franquicia
  - Como dueño, quiero registrar mi franquicia para empezar a usar el sistema
  - Como dueño, quiero crear sucursales para gestionar mi negocio
  [...]

  ### Cliente
  - Como cliente, quiero escanear un QR para tomar turno
  - Como cliente, quiero ver cuántas personas hay delante en la cola
  [...]

  ## 4. Requisitos Funcionales

  ### RF-001: Autenticación Multi-Social
  [...]

  ### RF-002: Sistema Multitenant
  [...]

  ## 5. Requisitos No Funcionales
  - Escalabilidad: Soportar 1000+ franquicias
  - Performance: Cola de turnos en tiempo real < 2s
  [...]

  ## 6. MVP vs Future Features

  **MVP (Fase 1):**
  - Autenticación básica (email + Google)
  - CRUD franquicias/sucursales/peluqueros
  - Sistema de turnos FIFO básico
  - Notificaciones push esenciales

  **Future (Fase 2+):**
  - Facebook/Apple login
  - Analytics avanzados
  - Reportes
  - Programa de fidelización
  [...]

  Siguiente Paso - Arquitectura:

  Tú: "Perfecto! Ahora usa el firebase-architect agent para diseñar
  la arquitectura de Firestore, security rules y Cloud Functions"

  El agent diseñará:
  # Arquitectura Firebase: App Peluquerías

  ## 1. Modelo de Datos Firestore

  ### Colecciones Principales:

  /franchises/{franchiseId}
  - name: string
  - ownerId: string
  - subscriptionStatus: enum
  - createdAt: timestamp

  /branches/{branchId}
  - franchiseId: string  // ← Tenant isolation
  - name: string
  - address: geo
  - qrCode: string

  /stylists/{stylistId}
  - franchiseId: string  // ← Tenant isolation
  - branchIds: string[]
  - name: string
  - schedule: map

  /queues/{branchId}/active/{queueItemId}
  - stylistId: string
  - clientId: string
  - position: number
  - status: enum
  - timestamp: timestamp

  /users/{userId}
  - role: enum
  - franchiseId: string (if staff)
  - fcmToken: string (for notifications)

  ## 2. Security Rules Multitenant

  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {

      // Helper functions
      function isAuthenticated() {
        return request.auth != null;
      }

      function isFranchiseOwner(franchiseId) {
        return isAuthenticated() &&
               get(/databases/$(database)/documents/franchises/$(franchiseId)).data.ownerId == request.auth.uid;
      }

      function isFranchiseMember(franchiseId) {
        return isAuthenticated() &&
               get(/databases/$(database)/documents/users/$(request.auth.uid)).data.franchiseId == franchiseId;
      }

      // Franchises
      match /franchises/{franchiseId} {
        allow read: if isFranchiseMember(franchiseId);
        allow create: if isAuthenticated(); // Anyone can create
        allow update, delete: if isFranchiseOwner(franchiseId);
      }

      // Branches - Tenant isolated
      match /branches/{branchId} {
        allow read: if isAuthenticated();
        allow write: if isFranchiseMember(resource.data.franchiseId);
      }

      // Queues - Public read, restricted write
      match /queues/{branchId}/active/{queueItemId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated(); // Clients can join
        allow delete: if isFranchiseMember(get(/databases/$(database)/documents/branches/$(branchId)).data.franchiseId);
      }
    }
  }

  3. Cloud Functions Necesarias

  Autenticación y Onboarding

  // onCreate user → create user document with default role
  export const onUserCreate = functions.auth.user().onCreate(...)

  // Assign franchise on first login
  export const assignUserToFranchise = functions.https.onCall(...)

  Sistema de Turnos

  // Join queue with position assignment
  export const joinQueue = functions.https.onCall(...)

  // Auto-advance queue when stylist marks as done
  export const advanceQueue = functions.firestore
    .document('queues/{branchId}/active/{queueItemId}')
    .onUpdate(...)

  // Remove expired queue items (no-show timeout)
  export const cleanupExpiredQueueItems = functions.pubsub
    .schedule('every 5 minutes')
    .onRun(...)

  Notificaciones

  // Trigger notification on queue position changes
  export const notifyQueuePosition = functions.firestore
    .document('queues/{branchId}/active/{queueItemId}')
    .onWrite(...)

  // Send "Your turn!" notification
  export const notifyTurnReady = functions.firestore
    .document('queues/{branchId}/active/{queueItemId}')
    .onUpdate(...)

  Pagos (Stripe)

  // Create subscription for new franchise
  export const createSubscription = functions.https.onCall(...)

  // Handle subscription webhook
  export const handleStripeWebhook = functions.https.onRequest(...)

  4. Índices Compuestos Necesarios

  {
    "indexes": [
      {
        "collectionGroup": "active",
        "queryScope": "COLLECTION",
        "fields": [
          {"fieldPath": "branchId", "order": "ASCENDING"},
          {"fieldPath": "position", "order": "ASCENDING"}
        ]
      },
      {
        "collectionGroup": "stylists",
        "queryScope": "COLLECTION",
        "fields": [
          {"fieldPath": "franchiseId", "order": "ASCENDING"},
          {"fieldPath": "branchIds", "arrayConfig": "CONTAINS"}
        ]
      }
    ]
  }

  5. Estrategia de Escalabilidad

  Tenant Isolation:
  - Todos los datos incluyen franchiseId
  - Security rules fuerzan el filtro por tenant
  - Previene data leakage entre franquicias

  Queue Performance:
  - Usar subcollection /queues/{branchId}/active para limitar queries
  - Archive completed queues to /queues/{branchId}/history/{date}
  - Maximum 100 active queue items per branch

  Costs Optimization:
  - Cache branch/stylist data in client
  - Use Firestore offline persistence
  - Batch notifications (not 1 per position change)
  [...]

  ---

  ### **Investigación Técnica (Si Necesitas):**
  Tú: "Usa el tech-researcher agent para investigar las mejores
  librerías de notificaciones push para Capacitor con Firebase"

  **El agent investigará y recomendará:**
  - `@capacitor/push-notifications` + Firebase Cloud Messaging
  - Ejemplos de código
  - Setup para iOS y Android
  - Best practices

  ---

  ### **Plan de Desarrollo Final:**
  Tú: "Ahora crea el TodoWrite MAESTRO completo con todos los milestones,
  indicando qué agents usar en cada fase y estimaciones de tiempo"

  **Claude Code creará:**
  ```markdown
  📋 TODOWRITE MAESTRO: App Peluquerías Multitenant

  ## 🎯 MILESTONE 1: Fundaciones (Sprint 1-2, ~3 semanas)

  ### Sprint 1: Setup y Autenticación (1.5 semanas)
  1. ⏳ Configurar proyecto Firebase (Auth, Firestore, Functions, Hosting)
  2. ⏳ Implementar social login (Google, email) - firebase-architect guidance
  3. ⏳ Crear modelo base Firestore (franchises, branches, users)
  4. ⏳ Implementar security rules multitenant
  5. ⏳ Tests autenticación - test-writer agent
  6. ⏳ Review - code-reviewer agent
  7. ⏳ Security audit - security-auditor agent
  8. ⏳ Deploy staging - /deploy-staging

  ### Sprint 2: CRUD Franquicias y Sucursales (1.5 semanas)
  9. ⏳ UI registro de franquicia
  10. ⏳ UI gestión de sucursales
  11. ⏳ Cloud Function: onboarding workflow
  12. ⏳ Generación de QR codes por sucursal
  13. ⏳ Tests CRUD - test-writer agent
  14. ⏳ Review - code-reviewer agent
  15. ⏳ Deploy staging - /deploy-staging

  ## 🎯 MILESTONE 2: Sistema de Turnos (Sprint 3-4, ~3 semanas)

  ### Sprint 3: Core Turnos FIFO (2 semanas)
  16. ⏳ Diseñar queue system en Firestore - firebase-architect agent
  17. ⏳ Implementar joinQueue Cloud Function
  18. ⏳ Implementar advanceQueue Cloud Function
  19. ⏳ UI cliente: escanear QR y unirse a cola
  20. ⏳ UI peluquero: ver cola y marcar como atendido
  21. ⏳ Real-time queue updates (Firestore listeners)
  22. ⏳ Tests sistema de turnos - test-writer agent
  23. ⏳ Review - code-reviewer agent
  24. ⏳ Deploy staging - /deploy-staging

  ### Sprint 4: Gestión de Horarios (1 semana)
  25. ⏳ UI gestión horarios de peluqueros
  26. ⏳ Lógica validación disponibilidad
  27. ⏳ Tests - test-writer agent
  28. ⏳ Review - code-reviewer agent
  29. ⏳ Deploy staging - /deploy-staging

  ## 🎯 MILESTONE 3: Notificaciones Push (Sprint 5, ~1 semana)

  30. ⏳ Investigar Capacitor Push + FCM - tech-researcher agent
  31. ⏳ Configurar Firebase Cloud Messaging
  32. ⏳ Implementar registro de FCM tokens
  33. ⏳ Cloud Function: notifyQueuePosition
  34. ⏳ Cloud Function: notifyTurnReady
  35. ⏳ Integrar @capacitor/push-notifications
  36. ⏳ Tests notificaciones - test-writer agent
  37. ⏳ Review - code-reviewer agent
  38. ⏳ Deploy staging - /deploy-staging
  39. ⏳ Test manual en dispositivos reales - qa-specialist agent

  ## 🎯 MILESTONE 4: Pagos y Subscripciones (Sprint 6, ~2 semanas)

  40. ⏳ Diseñar flujo de subscripción - firebase-architect agent
  41. ⏳ Integrar Stripe Checkout - cloud-functions-specialist agent
  42. ⏳ Implementar createSubscription function
  43. ⏳ Implementar webhook handler (handleStripeWebhook)
  44. ⏳ Lógica de acceso basado en subscription status
  45. ⏳ Tests pagos - test-writer agent
  46. ⏳ Primera security audit PAGOS - security-auditor agent ⚠️
  47. ⏳ Review - code-reviewer agent
  48. ⏳ Segunda security audit PAGOS - security-auditor agent ⚠️
  49. ⏳ Test payment flow - /test-payment-flow
  50. ⏳ Deploy staging - /deploy-staging
  51. ⏳ Test 48h en staging (MANDATORY para pagos)
  52. ⏳ Tercera security audit PAGOS - security-auditor agent ⚠️

  ## 🎯 MILESTONE 5: Mobile Build (Sprint 7, ~1 semana)

  53. ⏳ Configurar Capacitor para iOS - tech-researcher agent
  54. ⏳ Configurar Capacitor para Android
  55. ⏳ Implementar capacidades nativas (push, geolocation, camera para QR)
  56. ⏳ Build iOS - /build-mobile
  57. ⏳ Build Android - /build-mobile
  58. ⏳ Tests en dispositivos - qa-specialist agent
  59. ⏳ Review - code-reviewer agent

  ## 🎯 MILESTONE 6: Production Launch (Sprint 8, ~1 semana)

  60. ⏳ Documentación completa - documentation-writer agent
  61. ⏳ Final security audit - security-auditor agent
  62. ⏳ Performance optimization review - code-reviewer agent
  63. ⏳ Create monitoring dashboards
  64. ⏳ Deploy production - /deploy-production
  65. ⏳ Monitor 24h intensive - firebase-deployer agent
  66. ⏳ Post-launch retrospective

  ---

  ## 📊 Resumen

  **Total Sprints:** 8 sprints (~10-12 semanas)
  **Total Todos:** 66 tareas principales
  **Agents más usados:**
  - firebase-architect (arquitectura)
  - test-writer (tests en cada sprint)
  - code-reviewer (reviews en cada sprint)
  - security-auditor (3x para pagos!)
  - cloud-functions-specialist (backend)

  **⚠️ CRÍTICO:**
  - TODOS los cambios pasan por staging primero
  - Pagos requieren 3 audits de seguridad
  - Test 48h en staging antes de production para pagos

  ---
  📝 Resumen: Cómo Interactuar

  ✅ HACER:

  1. Empieza con conversación natural - Explica tu idea en detalle
  2. Responde preguntas de Claude - Clarifica requisitos
  3. Pide agents explícitamente - "Usa el X agent para..."
  4. Un agent a la vez - No mezcles análisis con arquitectura
  5. Pide TodoWrite maestro al final - Después de tener todo claro

  ❌ NO HACER:

  1. No pidas codear inmediatamente - Primero planifica TODO
  2. No saltes fases - Requisitos → Arquitectura → Investigación → Plan
  3. No asumas - Si algo no está claro, Claude preguntará
  4. No mezcles planificación con implementación - Son fases separadas

  ---
  🎯 Tu Comando Inicial Ideal

  Copia y pega esto para empezar:

  Hola Claude! Estoy en mi proyecto Firebase con sistema de agents configurado.

  Quiero desarrollar una aplicación de peluquerías multitenant. Características:
  - Sistema de franquicias con múltiples sucursales
  - Gestión de peluqueros y horarios
  - Sistema de turnos FIFO (no citas)
  - Notificaciones push
  - Social login (Google, Facebook, Apple)
  - Pagos con Stripe (subscripción por sucursal)
  - App móvil con Capacitor

  NO QUIERO CODEAR TODAVÍA. Primero necesito que me ayudes a:

  1. Analizar y refinar requisitos completos (user stories, casos de uso)
  2. Diseñar toda la arquitectura (Firestore, security rules, functions)
  3. Investigar tecnologías específicas si es necesario
  4. Crear un plan de desarrollo completo por sprints/milestones

  Hazme todas las preguntas que necesites para entender bien el proyecto,
  y luego usaremos los agents especializados para el análisis formal.

  Claude Code te guiará desde ahí! 🚀