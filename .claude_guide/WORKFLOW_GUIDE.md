# 🎯 Guía de Workflow con Claude Code

Esta guía documenta cómo trabajo yo (Claude) de forma óptima con este proyecto para aprovechar al máximo el sistema de agentes.

## 📋 Regla de Oro: SIEMPRE usar TodoWrite

**OBLIGATORIO**: Antes de empezar cualquier tarea, debo crear una lista de todos con `TodoWrite`.

### Por qué es obligatorio:

1. ✅ **Visibilidad**: El usuario ve exactamente qué haré
2. ✅ **Trazabilidad**: Se puede seguir el progreso en tiempo real
3. ✅ **Organización**: Evita olvidar pasos importantes
4. ✅ **Calidad**: Fuerza a pensar antes de actuar

### Ejemplo CORRECTO:

```
Usuario: "Implementa autenticación con Google"

Yo:
> Voy a usar TodoWrite para planificar esta tarea

TodoWrite:
1. Investigar requisitos de Firebase Auth con Google (pending)
2. Configurar Google OAuth en Firebase Console (pending)
3. Implementar componente de login con Google (pending)
4. Crear servicio de autenticación (pending)
5. Agregar tests para auth service (pending)
6. Revisar seguridad con security-auditor (pending)
7. Documentar el flujo de autenticación (pending)

> Ahora comenzaré con el primer todo...
```

### Ejemplo INCORRECTO ❌:

```
Usuario: "Implementa autenticación con Google"

Yo: "Voy a implementar la autenticación..."
[Empieza a codificar sin planificar]
```

## 🚀 Workflow General (Mi Proceso Estándar)

### 1️⃣ RECIBIR TAREA DEL USUARIO

```
Usuario: "Necesito implementar pagos con Stripe"
```

### 2️⃣ CREAR TODOS INMEDIATAMENTE

```markdown
**Yo respondo:**

Perfecto, voy a planificar la implementación de pagos con Stripe.

[Uso TodoWrite para crear lista completa de tareas]

Todos creados:
1. ✅ Analizar requisitos con requirements-analyst
2. ⏳ Diseñar arquitectura de pagos con firebase-architect
3. ⏳ Configurar Stripe en Firebase proyecto
4. ⏳ Implementar Cloud Function createPaymentIntent
5. ⏳ Implementar Cloud Function stripeWebhook
6. ⏳ Crear componente de pago en React
7. ⏳ Agregar tests con test-writer
8. ⏳ Auditar seguridad con security-auditor
9. ⏳ Testear flujo completo con /test-payment-flow
10. ⏳ Documentar API de pagos

Comenzaré con el primer todo: análisis de requisitos.
```

### 3️⃣ EJECUTAR CADA TODO SECUENCIALMENTE

#### Todo 1: Analizar requisitos

```markdown
**Marcando todo 1 como in_progress**

> Use the requirements-analyst agent to analyze payment requirements

[Agent analiza y responde]

**Marcando todo 1 como completed**
**Marcando todo 2 como in_progress**
```

#### Todo 2: Diseñar arquitectura

```markdown
> Use the firebase-architect agent to design the payment flow architecture

[Agent diseña arquitectura]

**Marcando todo 2 como completed**
**Marcando todo 3 como in_progress**
```

### 4️⃣ ACTUALIZAR TODOS EN TIEMPO REAL

- ✅ Marcar como `completed` inmediatamente al terminar
- ⏳ Marcar como `in_progress` antes de empezar
- 🔄 Agregar nuevos todos si se descubren tareas adicionales
- 🗑️ Eliminar todos que ya no sean relevantes

### 5️⃣ AL FINALIZAR

```markdown
✅ **Todos completados (10/10)**

Resumen de lo implementado:
- Pagos con Stripe configurados
- Cloud Functions creadas y testeadas
- UI de pago implementada
- Seguridad auditada
- Documentación completa

**Comandos útiles:**
- `/test-payment-flow` para testear
- `/security-audit` antes de producción
- `/deploy-staging` para desplegar a staging
```

## 🎭 Orquestación de Agentes (Mi Estrategia)

### Cuándo usar cada agente:

#### 🎨 PLANIFICACIÓN

**requirements-analyst**
- ✅ Al inicio de cualquier feature nueva
- ✅ Cuando el usuario pide algo vago/ambiguo
- ✅ Para crear user stories y acceptance criteria

```
> Use the requirements-analyst agent to analyze and document the user authentication requirements
```

**firebase-architect**
- ✅ Después del análisis de requisitos
- ✅ Para diseñar data models de Firestore
- ✅ Para planificar Cloud Functions
- ✅ Al refactorizar arquitectura

```
> Use the firebase-architect agent to design the Firestore data model for user profiles and subscriptions
```

**tech-researcher**
- ✅ Cuando necesito evaluar librerías
- ✅ Para buscar mejores prácticas
- ✅ Al decidir entre múltiples opciones técnicas

```
> Use the tech-researcher agent to compare state management libraries for this React app
```

#### 💻 DESARROLLO

**code-reviewer**
- ✅ SIEMPRE después de implementar código
- ✅ Antes de hacer commits importantes
- ✅ Antes de merge a main/master
- ✅ OBLIGATORIO para código de pagos

```
> Use the code-reviewer agent to review my payment implementation in functions/src/payments.ts
```

**test-writer**
- ✅ Después de implementar lógica de negocio
- ✅ Para Cloud Functions (especialmente pagos)
- ✅ Cuando se necesita aumentar coverage

```
> Use the test-writer agent to create comprehensive tests for the authentication service
```

**cloud-functions-specialist**
- ✅ Para implementar Cloud Functions
- ✅ SIEMPRE para pagos con Stripe
- ✅ Para webhooks y triggers de Firestore

```
> Use the cloud-functions-specialist agent to implement the Stripe webhook handler with signature verification
```

#### 🧪 TESTING & QA

**qa-specialist**
- ✅ Antes de cada release
- ✅ Para crear test plans
- ✅ Al recibir bug reports del usuario
- ✅ Para testing manual de features críticas

```
> Use the qa-specialist agent to create a comprehensive test plan for the payment flow
```

**security-auditor**
- ✅ OBLIGATORIO antes de producción
- ✅ SIEMPRE para features de pagos
- ✅ Después de cambios en security rules
- ✅ Periódicamente (cada 2-3 features)

```
> Use the security-auditor agent to perform a complete security audit focusing on the payment flow and Firestore security rules
```

#### 🚀 DEPLOYMENT

**firebase-deployer**
- ✅ Al configurar CI/CD
- ✅ Para deployment strategies
- ✅ Cuando hay problemas de deployment

```
> Use the firebase-deployer agent to set up GitHub Actions CI/CD for automated deployments
```

**documentation-writer**
- ✅ Al finalizar features importantes
- ✅ Para crear API documentation
- ✅ Para user guides
- ✅ Al preparar releases

```
> Use the documentation-writer agent to create API documentation for all Cloud Functions
```

## 📊 Workflows por Tipo de Tarea

### 🆕 Feature Nueva (Ejemplo: Sistema de Notificaciones)

```markdown
**TodoWrite:**
1. Analizar requisitos (requirements-analyst)
2. Diseñar arquitectura (firebase-architect)
3. Investigar librerías de push notifications (tech-researcher)
4. Implementar Cloud Function para envío
5. Implementar UI para gestionar notificaciones
6. Configurar Capacitor push notifications plugin
7. Crear tests (test-writer)
8. Revisar código (code-reviewer)
9. Revisar seguridad (security-auditor)
10. Documentar API (documentation-writer)
11. Testear en dispositivos reales (qa-specialist)
12. Deploy a staging (/deploy-staging)
13. Deploy a producción (/deploy-production)
```

**Ejecución paso a paso:**

```
[Todo 1] > Use requirements-analyst agent to document notification requirements
[Todo 2] > Use firebase-architect agent to design notification system architecture
[Todo 3] > Use tech-researcher agent to compare push notification libraries
[Todos 4-6] Implementar código...
[Todo 7] > Use test-writer agent to create tests for notification service
[Todo 8] > Use code-reviewer agent to review implementation
[Todo 9] > Use security-auditor agent to audit notification security
[Todo 10] > Use documentation-writer agent to document notification API
[Todo 11] > Use qa-specialist agent to create test plan for notifications
[Todo 12] > /deploy-staging
[Todo 13] > /deploy-production
```

### 🐛 Bug Fix (Ejemplo: Payment failing on iOS)

```markdown
**TodoWrite:**
1. Reproducir el bug (qa-specialist para pasos)
2. Analizar logs de Cloud Functions
3. Identificar causa raíz
4. Implementar fix
5. Crear test para prevenir regresión (test-writer)
6. Revisar fix (code-reviewer)
7. Testear en iOS device
8. Deploy hotfix a producción
```

### 🔄 Refactoring (Ejemplo: Optimizar Firestore queries)

```markdown
**TodoWrite:**
1. Analizar queries actuales y performance
2. Diseñar nueva estructura (firebase-architect)
3. Planificar migración de datos
4. Implementar nuevas queries
5. Crear tests (test-writer)
6. Revisar código (code-reviewer)
7. Testear performance en emulators
8. Deploy gradual a producción
```

### 💳 Feature de Pagos (CRÍTICA - proceso especial)

```markdown
**TodoWrite:**
1. ⚠️  Analizar requisitos de pago (requirements-analyst)
2. ⚠️  Diseñar flujo seguro (firebase-architect)
3. ⚠️  Implementar createPaymentIntent function
4. ⚠️  Implementar webhook handler
5. ⚠️  Implementar UI de pago
6. ⚠️  Tests exhaustivos (test-writer)
7. ⚠️  AUDITORÍA DE SEGURIDAD OBLIGATORIA (security-auditor)
8. ⚠️  Test con todas las tarjetas de prueba (/test-payment-flow)
9. ⚠️  Revisar código línea por línea (code-reviewer)
10. ⚠️ Testear webhooks en staging
11. ⚠️ Documentar (documentation-writer)
12. ⚠️ Deploy a staging y testear 48 horas
13. ⚠️ Segunda auditoría de seguridad
14. ⚠️ Deploy a producción con monitoring intensivo
```

**REGLA ESPECIAL PARA PAGOS:**
- ✅ NUNCA saltarse el security-auditor
- ✅ SIEMPRE testear con /test-payment-flow
- ✅ SIEMPRE desplegar a staging primero
- ✅ DOBLE revisión de código

## 🎯 Comandos Slash: Cuándo usarlos

### `/deploy-staging`
**Usar cuando:**
- ✅ Feature completa y lista para testing
- ✅ Después de pasar todos los tests locales
- ✅ Antes de deploy a producción (SIEMPRE)

**Mi workflow:**
```
1. TodoWrite: marcar todo "Deploy to staging"
2. Ejecutar: /deploy-staging
3. Monitorear logs
4. Testear manualmente
5. TodoWrite: marcar como completed
```

### `/deploy-production`
**Usar cuando:**
- ✅ Staging testeado por al menos 24h
- ✅ Security audit completado
- ✅ Todos los tests passing
- ✅ Documentación actualizada

**Mi workflow:**
```
1. TodoWrite: "Deploy to production" (último todo)
2. Verificar todos los checks pasaron
3. Ejecutar: /deploy-production
4. Monitorear por 15-30 minutos
5. Verificar analytics no muestran errores
6. TodoWrite: marcar como completed
```

### `/test-payment-flow`
**Usar cuando:**
- ✅ Implementando nueva feature de pagos
- ✅ Modificando código de pagos existente
- ✅ Antes de cada deploy (staging y prod)
- ✅ Periódicamente para regression testing

### `/security-audit`
**Usar cuando:**
- ✅ Antes de cada deploy a producción
- ✅ Después de cambios en security rules
- ✅ Después de implementar pagos
- ✅ Después de agregar nueva Cloud Function
- ✅ Periódicamente (semanal/mensual)

### `/build-mobile`
**Usar cuando:**
- ✅ Listo para release a App Store / Play Store
- ✅ Necesitas testear en dispositivo real
- ✅ Preparando beta builds

## 📱 Ejemplo Completo: Feature de Inicio a Fin

**Tarea del usuario:** "Quiero implementar un sistema de comentarios en los posts"

### Mi respuesta completa:

```markdown
Perfecto, voy a implementar el sistema de comentarios. Primero, déjame planificar todas las tareas necesarias.

**PLANIFICACIÓN (TodoWrite):**

1. ⏳ Analizar requisitos del sistema de comentarios (requirements-analyst)
2. ⏳ Diseñar data model de Firestore (firebase-architect)
3. ⏳ Diseñar security rules para comentarios (firebase-architect)
4. ⏳ Implementar Cloud Function para crear comentarios
5. ⏳ Implementar Cloud Function para moderación (opcional)
6. ⏳ Crear componente CommentList en React
7. ⏳ Crear componente CommentForm en React
8. ⏳ Implementar real-time updates de comentarios
9. ⏳ Agregar paginación para comentarios
10. ⏳ Crear tests unitarios (test-writer)
11. ⏳ Crear tests de integración (test-writer)
12. ⏳ Revisar código (code-reviewer)
13. ⏳ Revisar seguridad (security-auditor)
14. ⏳ Crear test plan manual (qa-specialist)
15. ⏳ Documentar API (documentation-writer)
16. ⏳ Deploy a staging (/deploy-staging)
17. ⏳ Testing en staging
18. ⏳ Deploy a producción (/deploy-production)

---

**EJECUCIÓN:**

**[Todo 1 - IN PROGRESS]** Analizando requisitos...

> Use the requirements-analyst agent to analyze and document the commenting system requirements including:
> - User authentication requirements
> - Comment structure (text, attachments, mentions)
> - Moderation needs
> - Real-time vs polling
> - Pagination requirements
> - Edit/delete permissions

[Agent responde con análisis detallado]

**[Todo 1 - COMPLETED]**
**[Todo 2 - IN PROGRESS]** Diseñando data model...

> Use the firebase-architect agent to design the Firestore data model for comments including:
> - Collection structure (posts/{postId}/comments vs top-level comments collection)
> - Document schema
> - Indexes needed
> - Security rules design
> - Scalability considerations

[Agent diseña arquitectura]

Arquitectura propuesta:
```javascript
comments/{commentId}
  - postId: string (indexed)
  - userId: string (indexed)
  - text: string
  - createdAt: timestamp (indexed)
  - updatedAt: timestamp
  - likes: number
  - isModerated: boolean
```

**[Todo 2 - COMPLETED]**
**[Todo 3 - IN PROGRESS]** Diseñando security rules...

> Use the firebase-architect agent to design Firestore security rules for the comments system

[Agent diseña rules]

```javascript
match /comments/{commentId} {
  allow read: if true; // Public read
  allow create: if request.auth != null
                && request.resource.data.userId == request.auth.uid
                && request.resource.data.text.size() > 0
                && request.resource.data.text.size() <= 500;
  allow update: if request.auth != null
                && resource.data.userId == request.auth.uid
                && request.resource.data.userId == resource.data.userId; // Can't change author
  allow delete: if request.auth != null
                && (resource.data.userId == request.auth.uid || isAdmin());
}
```

**[Todo 3 - COMPLETED]**
**[Todos 4-9 - IN PROGRESS]** Implementando código...

[Implemento todas las funciones y componentes]

**[Todos 4-9 - COMPLETED]**
**[Todo 10 - IN PROGRESS]** Creando tests unitarios...

> Use the test-writer agent to create comprehensive unit tests for:
> - Comment creation service
> - Comment update service
> - Comment deletion service
> - CommentList component
> - CommentForm component

[Agent crea tests]

**[Todo 10 - COMPLETED]**
**[Todo 11 - IN PROGRESS]** Creando tests de integración...

> Use the test-writer agent to create integration tests for the complete comment flow using Firebase emulators

[Agent crea integration tests]

**[Todo 11 - COMPLETED]**
**[Todo 12 - IN PROGRESS]** Revisando código...

> Use the code-reviewer agent to review the complete comments implementation focusing on:
> - Code quality and maintainability
> - Firebase best practices
> - Performance optimization
> - Error handling

[Agent revisa y proporciona feedback]

Feedback recibido:
🔴 Critical: Falta validación de longitud en Cloud Function
🟡 Warning: Considera agregar rate limiting
🔵 Suggestion: Usar batch para likes

Aplicando correcciones...

**[Todo 12 - COMPLETED]**
**[Todo 13 - IN PROGRESS]** Auditando seguridad...

> Use the security-auditor agent to perform security audit on the comments system

[Agent audita seguridad]

Audit findings:
✅ Security rules are properly configured
✅ Input validation implemented
✅ No XSS vulnerabilities
⚠️  Recommendation: Add rate limiting for comment creation

Implementando rate limiting...

**[Todo 13 - COMPLETED]**
**[Todo 14 - IN PROGRESS]** Creando test plan...

> Use the qa-specialist agent to create a comprehensive test plan for the comments feature

[Agent crea test plan detallado]

**[Todo 14 - COMPLETED]**
**[Todo 15 - IN PROGRESS]** Documentando API...

> Use the documentation-writer agent to create documentation for the comments API

[Agent crea documentación]

**[Todo 15 - COMPLETED]**
**[Todo 16 - IN PROGRESS]** Desplegando a staging...

> /deploy-staging

[Deploy se ejecuta con todos los checks]

Deploy exitoso! URL: https://staging.myapp.com

**[Todo 16 - COMPLETED]**
**[Todo 17 - IN PROGRESS]** Testing en staging...

> Use the qa-specialist agent to verify the test plan in staging environment

Testeando:
✅ Crear comentario
✅ Editar comentario
✅ Eliminar comentario
✅ Real-time updates
✅ Paginación
✅ Moderación
✅ Permisos

**[Todo 17 - COMPLETED]**
**[Todo 18 - IN PROGRESS]** Desplegando a producción...

> /deploy-production

[Deploy a producción con confirmación]

✅ Deployed to production!

Monitoreando logs...
✅ No errors en primeros 15 minutos
✅ Analytics normal
✅ Comments funcionando correctamente

**[Todo 18 - COMPLETED]**

---

## ✅ FEATURE COMPLETADA (18/18)

**Resumen:**
- ✅ Sistema de comentarios implementado
- ✅ Real-time updates funcionando
- ✅ Seguridad auditada y aprobada
- ✅ Tests creados (90% coverage)
- ✅ Documentación completa
- ✅ Desplegado a producción

**Archivos modificados:**
- `src/components/CommentList.tsx`
- `src/components/CommentForm.tsx`
- `src/services/comments.ts`
- `functions/src/comments.ts`
- `firestore.rules`
- `tests/comments.test.ts`
- `docs/API.md`

**Próximos pasos sugeridos:**
- Monitorear analytics por 48 horas
- Considerar agregar threading a comentarios
- Implementar notificaciones de nuevos comentarios
```

---

Este es exactamente cómo yo trabajaría esta feature completa, usando todos los agentes disponibles y manteniendo el TodoWrite actualizado en cada paso.

## 🎓 Lecciones Aprendidas (Mejores Prácticas)

### ✅ SIEMPRE:

1. **Crear TodoWrite antes de empezar**
2. **Usar agentes especializados para cada fase**
3. **Marcar todos como completed inmediatamente**
4. **Hacer security audit antes de producción**
5. **Testear en staging antes de producción**
6. **Desplegar gradualmente (staging → prod)**
7. **Monitorear después de cada deploy**

### ❌ NUNCA:

1. **Empezar a codificar sin TodoWrite**
2. **Saltarse el code-reviewer**
3. **Deploy a producción sin staging**
4. **Ignorar warnings del security-auditor**
5. **Deploy de pagos sin /test-payment-flow**
6. **Commitear sin revisar cambios**
7. **Deploy sin tests pasando**

### 🎯 REGLAS ESPECIALES:

#### Para Pagos:
- ✅ DOBLE revisión (code-reviewer + security-auditor)
- ✅ TRIPLE testing (unit + integration + /test-payment-flow)
- ✅ Deploy a staging mínimo 48h antes de producción
- ✅ Monitoring intensivo post-deploy

#### Para Security Rules:
- ✅ Diseñar con firebase-architect
- ✅ Revisar con security-auditor
- ✅ Testear en emulators antes de deploy
- ✅ Deploy solo security rules primero, luego código

#### Para Cloud Functions:
- ✅ Diseñar con cloud-functions-specialist
- ✅ Tests exhaustivos (test-writer)
- ✅ Revisar performance y cold starts
- ✅ Monitorear invocations post-deploy

## 🔄 Ciclo de Feedback Continuo

Después de cada feature:

```markdown
**TodoWrite - Post-Feature Review:**
1. ⏳ Revisar qué funcionó bien
2. ⏳ Identificar qué se puede mejorar
3. ⏳ Actualizar documentación si es necesario
4. ⏳ Compartir aprendizajes con el equipo
```

---

**Resumen:** Esta guía es mi "libro de jugadas" para trabajar de forma óptima con este proyecto. TodoWrite es el núcleo que mantiene todo organizado, y los agentes especializados son las herramientas que uso en cada fase para garantizar calidad máxima.
