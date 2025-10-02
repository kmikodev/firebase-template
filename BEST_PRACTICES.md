# 🏆 Best Practices - Agentes y Workflow

Guía definitiva de mejores prácticas para trabajar con Claude Code en este proyecto.

## 🎯 Regla #1: TodoWrite es OBLIGATORIO

```
NO HAY EXCEPCIONES.
TODA TAREA EMPIEZA CON TodoWrite.
```

**Antes de hacer CUALQUIER cosa:**
1. Crear lista completa de todos
2. Incluir agentes que usarás
3. Actualizar en tiempo real
4. Solo 1 todo `in_progress` a la vez

**Ver:** `.claude/TODOWRITE_POLICY.md` para detalles completos.

## 🤖 Matriz de Decisión de Agentes

### ¿Qué agente usar? (Flowchart)

```
┌─────────────────────────────────────┐
│   ¿Qué tipo de tarea tengo?        │
└─────────────┬───────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    v                   v
┌─────────┐      ┌─────────────┐
│ Nueva   │      │ Bug Fix /   │
│ Feature │      │ Maintenance │
└────┬────┘      └──────┬──────┘
     │                  │
     v                  v

NUEVA FEATURE:                BUG FIX:
1. requirements-analyst       1. qa-specialist (reproduce)
2. firebase-architect         2. [diagnosticar]
3. tech-researcher (si hay    3. [implementar fix]
   decisiones técnicas)       4. test-writer (regression)
4. [implementar]              5. code-reviewer
5. test-writer                6. [deploy]
6. code-reviewer
7. security-auditor (si
   toca pagos/auth/data)
8. qa-specialist
9. documentation-writer
10. [deploy]
```

### ¿Es una feature de PAGOS?

```
SI ES PAGOS:
┌─────────────────────────────────────┐
│ WORKFLOW ESPECIAL - MÁS RIGUROSO   │
└─────────────────────────────────────┘

1. requirements-analyst (requisitos)
2. firebase-architect (diseño seguro)
3. cloud-functions-specialist (implementación)
4. test-writer (tests exhaustivos)
5. code-reviewer (primera revisión)
6. security-auditor (OBLIGATORIO - primera auditoría)
7. /test-payment-flow (testear con todas las tarjetas)
8. code-reviewer (segunda revisión)
9. security-auditor (SEGUNDA auditoría)
10. qa-specialist (test plan manual)
11. /deploy-staging
12. [testear en staging 48h mínimo]
13. security-auditor (tercera auditoría en staging)
14. /deploy-production
15. [monitoring intensivo 24h]

NO SE PUEDE SALTAR NINGÚN PASO.
```

## 📋 Checklist de Calidad

### Antes de Cualquier Commit:

```markdown
- [ ] TodoWrite creado y actualizado
- [ ] Código implementado
- [ ] Tests creados (test-writer agent)
- [ ] Código revisado (code-reviewer agent)
- [ ] Tests pasando (npm test)
- [ ] Linting pasando (npm run lint)
- [ ] No console.log en código de producción
- [ ] No secrets expuestos
```

### Antes de Deploy a Staging:

```markdown
- [ ] Checklist de commits completado ↑
- [ ] Security audit si toca auth/pagos/data (security-auditor)
- [ ] Documentación actualizada (documentation-writer)
- [ ] Variables de entorno configuradas
- [ ] Firebase security rules actualizadas si es necesario
- [ ] /security-audit ejecutado sin errores críticos
```

### Antes de Deploy a Producción:

```markdown
- [ ] Checklist de staging completado ↑
- [ ] Testeado en staging mínimo 24h (48h para pagos)
- [ ] Segunda security audit (security-auditor)
- [ ] QA manual completado (qa-specialist)
- [ ] Smoke tests definidos
- [ ] Rollback plan documentado
- [ ] Monitoring configurado
- [ ] Changelog actualizado
```

## 🎨 Orquestación de Agentes - Patterns

### Pattern 1: Análisis → Diseño → Implementación

```markdown
**Mejor para:** Features nuevas completas

**TodoWrite:**
1. requirements-analyst → Documentar requisitos
2. firebase-architect → Diseñar arquitectura
3. tech-researcher → Investigar librerías (si necesario)
4. [implementación manual]
5. test-writer → Crear tests
6. code-reviewer → Revisar implementación
7. security-auditor → Auditar (si sensible)
8. qa-specialist → Test plan manual
9. documentation-writer → Documentar

**Tiempo estimado:** 2-5 horas (dependiendo de complejidad)
```

### Pattern 2: Fix rápido → Test → Review

```markdown
**Mejor para:** Bug fixes pequeños

**TodoWrite:**
1. qa-specialist → Crear pasos de reproducción
2. [identificar causa]
3. [implementar fix]
4. test-writer → Regression test
5. code-reviewer → Revisar fix
6. [deploy]

**Tiempo estimado:** 30min - 2 horas
```

### Pattern 3: Research → Prototype → Decide

```markdown
**Mejor para:** Decisiones técnicas (qué librería usar, etc.)

**TodoWrite:**
1. tech-researcher → Investigar opciones
2. requirements-analyst → Definir criterios de decisión
3. [crear prototipos si necesario]
4. firebase-architect → Evaluar impacto arquitectural
5. [tomar decisión]
6. documentation-writer → Documentar decisión

**Tiempo estimado:** 1-3 horas
```

### Pattern 4: Refactor → Test → Verify

```markdown
**Mejor para:** Refactoring y optimización

**TodoWrite:**
1. code-reviewer → Analizar código actual
2. firebase-architect → Diseñar mejora (si arquitectural)
3. [implementar refactor]
4. test-writer → Tests para evitar regresiones
5. code-reviewer → Revisar refactor
6. [performance testing]
7. [deploy gradual]

**Tiempo estimado:** 2-4 horas
```

## 🚦 Niveles de Rigor por Tipo de Código

### 🟢 Bajo Riesgo (UI, Componentes visuales)

```markdown
Agentes requeridos:
- code-reviewer (opcional pero recomendado)
- test-writer (para lógica compleja)

Deploy:
- Puede ir directo a staging
- 2-4 horas en staging antes de producción
```

### 🟡 Riesgo Medio (Lógica de negocio, APIs)

```markdown
Agentes requeridos:
- requirements-analyst (para features nuevas)
- firebase-architect (para cambios de arquitectura)
- test-writer (OBLIGATORIO)
- code-reviewer (OBLIGATORIO)
- qa-specialist (test plan)

Deploy:
- DEBE ir a staging primero
- Mínimo 12-24 horas en staging
- Smoke tests antes de producción
```

### 🔴 Alto Riesgo (Auth, Pagos, Data Sensible)

```markdown
Agentes requeridos:
- requirements-analyst (OBLIGATORIO)
- firebase-architect (OBLIGATORIO)
- cloud-functions-specialist (para Cloud Functions)
- test-writer (OBLIGATORIO - tests exhaustivos)
- code-reviewer (OBLIGATORIO - doble revisión)
- security-auditor (OBLIGATORIO - múltiples auditorías)
- qa-specialist (OBLIGATORIO - test plan manual)
- documentation-writer (OBLIGATORIO)

Deploy:
- DEBE ir a staging primero
- Mínimo 48 horas en staging
- /test-payment-flow si es pagos
- /security-audit antes de cada deploy
- Deploy gradual a producción
- Monitoring intensivo post-deploy
```

## 📊 Métricas de Calidad

### Medir el éxito de cada feature:

```markdown
✅ Code Coverage:
   - Lógica de negocio: >80%
   - Cloud Functions: >90%
   - Pagos: 100%

✅ Revisiones:
   - Toda feature: code-reviewer
   - Features sensibles: code-reviewer + security-auditor
   - Pagos: code-reviewer + security-auditor (2x)

✅ Tests:
   - Unit tests para toda lógica
   - Integration tests para Cloud Functions
   - E2E tests para flujos críticos
   - Manual QA para pagos

✅ Documentación:
   - README actualizado
   - API docs para nuevos endpoints
   - CHANGELOG actualizado
   - User guide si afecta UX
```

## 🎯 Workflows Comunes (Quick Reference)

### Implementar Autenticación

```markdown
TodoWrite:
1. requirements-analyst → Requisitos de auth
2. firebase-architect → Diseño de flujo
3. Configurar Firebase Auth
4. Implementar componentes de login/signup
5. Implementar auth service
6. test-writer → Tests de auth
7. code-reviewer → Revisar
8. security-auditor → Auditar
9. qa-specialist → Test plan
10. /deploy-staging
11. /deploy-production

Agentes: 5 | Tiempo: 4-6 horas
```

### Implementar Pagos con Stripe

```markdown
TodoWrite:
1. requirements-analyst → Requisitos
2. firebase-architect → Arquitectura segura
3. Configurar Stripe en Firebase
4. cloud-functions-specialist → createPaymentIntent
5. cloud-functions-specialist → stripeWebhook
6. Implementar UI de pago
7. test-writer → Tests exhaustivos
8. code-reviewer → Primera revisión
9. security-auditor → Primera auditoría
10. /test-payment-flow → Testear
11. security-auditor → Segunda auditoría
12. qa-specialist → Test plan manual
13. documentation-writer → Documentar API
14. /deploy-staging
15. [Testing 48h en staging]
16. security-auditor → Auditoría en staging
17. /deploy-production
18. [Monitoring 24h]

Agentes: 8 | Tiempo: 8-12 horas
```

### Implementar Real-time Chat

```markdown
TodoWrite:
1. requirements-analyst → Requisitos
2. firebase-architect → Diseño de data model
3. tech-researcher → Investigar librerías de chat
4. Implementar Firestore collections
5. Implementar real-time listeners
6. Implementar UI de chat
7. Implementar notificaciones
8. test-writer → Tests
9. code-reviewer → Revisar
10. security-auditor → Auditar reglas
11. qa-specialist → Test plan
12. /deploy-staging
13. /deploy-production

Agentes: 6 | Tiempo: 6-10 horas
```

### Fix Bug en Producción

```markdown
TodoWrite:
1. qa-specialist → Reproducir bug
2. Analizar logs (Firebase MCP si disponible)
3. Identificar causa raíz
4. Implementar fix
5. test-writer → Regression test
6. code-reviewer → Revisar fix
7. Test en local
8. /deploy-staging
9. Verificar fix en staging
10. /deploy-production (hotfix)
11. Monitoring post-deploy

Agentes: 3 | Tiempo: 1-3 horas
```

## 🔐 Security Best Practices

### Siempre Auditar:

```markdown
✅ Antes de deploy a producción (SIEMPRE)
✅ Después de cambios en security rules
✅ Después de implementar pagos
✅ Después de cambios en auth
✅ Después de nuevas Cloud Functions
✅ Periódicamente (mensual)
```

### Security Checklist:

```markdown
- [ ] /security-audit ejecutado sin críticos
- [ ] security-auditor agent revisó código sensible
- [ ] No secrets en código (todos en .env)
- [ ] Firestore rules probadas en emulators
- [ ] Cloud Functions validan auth
- [ ] Input sanitization en todos los endpoints
- [ ] Webhook signatures verificadas (si aplica)
- [ ] Payment data solo en Stripe (NUNCA en Firestore)
```

## 📚 Recursos por Agente

### requirements-analyst
- **Cuándo:** Inicio de features, requisitos vagos
- **Output:** User stories, acceptance criteria
- **Siguiente paso:** firebase-architect

### firebase-architect
- **Cuándo:** Diseño de arquitectura, data models
- **Output:** Data model, security rules, arquitectura
- **Siguiente paso:** Implementación o tech-researcher

### tech-researcher
- **Cuándo:** Decisiones técnicas, evaluar librerías
- **Output:** Comparación de opciones, recomendación
- **Siguiente paso:** Implementación

### code-reviewer
- **Cuándo:** Después de implementar código
- **Output:** Issues encontrados, mejoras sugeridas
- **Siguiente paso:** Corregir issues, luego test-writer

### test-writer
- **Cuándo:** Después de implementar lógica
- **Output:** Tests unitarios y de integración
- **Siguiente paso:** code-reviewer o security-auditor

### cloud-functions-specialist
- **Cuándo:** Implementar Cloud Functions, especialmente pagos
- **Output:** Código de Cloud Function optimizado y seguro
- **Siguiente paso:** test-writer

### security-auditor
- **Cuándo:** Pagos, auth, antes de producción
- **Output:** Vulnerabilidades encontradas, recomendaciones
- **Siguiente paso:** Corregir issues, luego qa-specialist

### qa-specialist
- **Cuándo:** Test plans, bug reproduction, pre-release
- **Output:** Test plan, bug reports
- **Siguiente paso:** documentation-writer o deploy

### firebase-deployer
- **Cuándo:** Setup CI/CD, troubleshooting deploys
- **Output:** CI/CD config, deployment strategy
- **Siguiente paso:** Deploy

### documentation-writer
- **Cuándo:** Finalizar features, crear API docs
- **Output:** Documentación técnica y user guides
- **Siguiente paso:** Deploy

## 💡 Tips Finales

1. **TodoWrite SIEMPRE primero** - No hay excepciones
2. **Un agente a la vez** - No mezcles responsabilidades
3. **Actualiza todos en tiempo real** - No batches
4. **Pagos = máximo rigor** - Doble/triple check todo
5. **Staging primero** - NUNCA directo a producción
6. **Security audit frecuente** - Mejor prevenir que lamentar
7. **Documenta todo** - Tu futuro yo te lo agradecerá
8. **Monitorea post-deploy** - Los primeros 15 minutos son críticos

---

**Recuerda:** Estas prácticas existen por una razón. Siguelas religiosamente y tendrás un proyecto de alta calidad, seguro, y mantenible.
