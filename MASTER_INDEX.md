# 📚 Master Index - Documentación Completa del Proyecto

Guía centralizada de toda la documentación disponible para trabajar con este proyecto.

## 🚀 Quick Start

**Si eres nuevo aquí, empieza por estos archivos en orden:**

1. **[README.md](README.md)** - Vista general y quick start (5 min)
2. **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Configuración completa del proyecto (15 min)
3. **[CLAUDE.md](CLAUDE.md)** - Guía técnica completa para Claude Code (30 min)
4. **[WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md)** - Cómo trabajo yo (Claude) en este proyecto (20 min)

## 📖 Documentación por Categoría

### 🎯 Configuración Inicial

| Archivo | Descripción | Cuándo Leerlo |
|---------|-------------|---------------|
| **[README.md](README.md)** | Overview del proyecto, quick start | Primero |
| **[SETUP_GUIDE.md](SETUP_GUIDE.md)** | Guía completa de configuración | Al empezar |
| **[CLAUDE.md](CLAUDE.md)** | Guía técnica para Claude Code | Al configurar agentes |
| **[package.json](package.json)** | Dependencias y scripts | Al instalar |
| **[.env.example](.env.example)** | Variables de entorno | Al configurar Firebase |

### 🤖 Sistema de Agentes

| Archivo | Descripción | Cuándo Leerlo |
|---------|-------------|---------------|
| **[WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md)** | Cómo usar agentes efectivamente | Obligatorio antes de empezar |
| **[BEST_PRACTICES.md](BEST_PRACTICES.md)** | Mejores prácticas y patterns | Referencia constante |
| **[EXAMPLE_WORKFLOWS.md](EXAMPLE_WORKFLOWS.md)** | Casos reales resueltos | Para aprender workflows |
| **[.claude/TODOWRITE_POLICY.md](.claude/TODOWRITE_POLICY.md)** | Política obligatoria de TodoWrite | Crítico - leer primero |

### 🔌 Integraciones

| Archivo | Descripción | Cuándo Leerlo |
|---------|-------------|---------------|
| **[MCP_SETUP.md](MCP_SETUP.md)** | Configuración de MCP servers | Al configurar Firebase/Stripe MCP |

### 🎨 Agentes Disponibles (`.claude/agents/`)

#### Planificación
- **[firebase-architect.md](.claude/agents/firebase-architect.md)** - Arquitectura y diseño
- **[requirements-analyst.md](.claude/agents/requirements-analyst.md)** - Análisis de requisitos
- **[tech-researcher.md](.claude/agents/tech-researcher.md)** - Investigación tecnológica

#### Desarrollo
- **[code-reviewer.md](.claude/agents/code-reviewer.md)** - Revisión de código
- **[test-writer.md](.claude/agents/test-writer.md)** - Escritura de tests
- **[cloud-functions-specialist.md](.claude/agents/cloud-functions-specialist.md)** - Cloud Functions y pagos

#### Testing & QA
- **[qa-specialist.md](.claude/agents/qa-specialist.md)** - QA y testing manual
- **[security-auditor.md](.claude/agents/security-auditor.md)** - Auditorías de seguridad

#### Deployment
- **[firebase-deployer.md](.claude/agents/firebase-deployer.md)** - Deployment y CI/CD
- **[documentation-writer.md](.claude/agents/documentation-writer.md)** - Documentación

### 🎮 Comandos Personalizados (`.claude/commands/`)

| Comando | Archivo | Descripción |
|---------|---------|-------------|
| `/deploy-staging` | [deploy-staging.md](.claude/commands/deploy-staging.md) | Deploy a staging con validaciones |
| `/deploy-production` | [deploy-production.md](.claude/commands/deploy-production.md) | Deploy a producción |
| `/test-payment-flow` | [test-payment-flow.md](.claude/commands/test-payment-flow.md) | Testear pagos con Stripe |
| `/security-audit` | [security-audit.md](.claude/commands/security-audit.md) | Auditoría de seguridad |
| `/build-mobile` | [build-mobile.md](.claude/commands/build-mobile.md) | Build iOS/Android |

### 🎨 Estilos de Output (`.claude/output-styles/`)

| Estilo | Archivo | Cuándo Usar |
|--------|---------|-------------|
| **Technical** | [technical.md](.claude/output-styles/technical.md) | Comunicación con developers |
| **Executive** | [executive.md](.claude/output-styles/executive.md) | Reports para stakeholders |
| **QA** | [qa.md](.claude/output-styles/qa.md) | Bug reports y test results |

### ⚙️ Configuración Técnica

| Archivo | Descripción | Cuándo Modificar |
|---------|-------------|------------------|
| **[firebase.json](firebase.json)** | Config de Firebase | Al agregar servicios |
| **[capacitor.config.json](capacitor.config.json)** | Config de Capacitor | Al configurar mobile |
| **[vite.config.ts](vite.config.ts)** | Config de Vite | Al agregar plugins |
| **[tailwind.config.js](tailwind.config.js)** | Config de Tailwind | Al personalizar theme |
| **[tsconfig.json](tsconfig.json)** | Config de TypeScript | Al cambiar compilación |

## 🎯 Guías por Escenario

### Escenario 1: "Soy nuevo en el proyecto"

**Lee en este orden:**
1. [README.md](README.md) - 5 min
2. [SETUP_GUIDE.md](SETUP_GUIDE.md) - 15 min
3. [CLAUDE.md](CLAUDE.md) - 30 min
4. [.claude/TODOWRITE_POLICY.md](.claude/TODOWRITE_POLICY.md) - 10 min
5. [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) - 20 min
6. [BEST_PRACTICES.md](BEST_PRACTICES.md) - 15 min

**Tiempo total:** ~1.5 horas

### Escenario 2: "Necesito implementar una feature"

**Consulta:**
1. [.claude/TODOWRITE_POLICY.md](.claude/TODOWRITE_POLICY.md) - Crear todos primero
2. [BEST_PRACTICES.md](BEST_PRACTICES.md) - Ver pattern apropiado
3. [EXAMPLE_WORKFLOWS.md](EXAMPLE_WORKFLOWS.md) - Ver ejemplo similar
4. Agentes relevantes en `.claude/agents/`

### Escenario 3: "Necesito hacer un deploy"

**Consulta:**
1. [BEST_PRACTICES.md](BEST_PRACTICES.md) - Checklist pre-deploy
2. [.claude/commands/deploy-staging.md](.claude/commands/deploy-staging.md) - Deploy staging
3. [.claude/commands/deploy-production.md](.claude/commands/deploy-production.md) - Deploy producción
4. [.claude/agents/firebase-deployer.md](.claude/agents/firebase-deployer.md) - Si hay issues

### Escenario 4: "Necesito implementar pagos"

**Consulta (en orden):**
1. [.claude/TODOWRITE_POLICY.md](.claude/TODOWRITE_POLICY.md) - Planificar
2. [BEST_PRACTICES.md](BEST_PRACTICES.md) - Ver workflow de pagos
3. [.claude/agents/cloud-functions-specialist.md](.claude/agents/cloud-functions-specialist.md) - Implementación
4. [.claude/agents/security-auditor.md](.claude/agents/security-auditor.md) - Auditoría
5. [.claude/commands/test-payment-flow.md](.claude/commands/test-payment-flow.md) - Testing
6. [EXAMPLE_WORKFLOWS.md](EXAMPLE_WORKFLOWS.md) - Ver ejemplo de pagos

### Escenario 5: "Hay un bug en producción"

**Consulta:**
1. [EXAMPLE_WORKFLOWS.md](EXAMPLE_WORKFLOWS.md) - Ver workflow de hotfix
2. [.claude/agents/qa-specialist.md](.claude/agents/qa-specialist.md) - Reproducir
3. [MCP_SETUP.md](MCP_SETUP.md) - Usar Firebase MCP para logs
4. [.claude/agents/code-reviewer.md](.claude/agents/code-reviewer.md) - Revisar fix

### Escenario 6: "Necesito configurar MCP"

**Consulta:**
1. [MCP_SETUP.md](MCP_SETUP.md) - Guía completa de MCP
2. [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) - Integración con workflow

## 📋 Checklists Rápidas

### ✅ Antes de Empezar Cualquier Tarea

```markdown
- [ ] Leí .claude/TODOWRITE_POLICY.md
- [ ] Voy a crear TodoWrite ANTES de empezar
- [ ] Identifiqué qué agentes necesito
- [ ] Consulté BEST_PRACTICES.md para el pattern
```

### ✅ Antes de Commit

```markdown
- [ ] Tests pasando (npm test)
- [ ] Linting pasando (npm run lint)
- [ ] TodoWrite actualizado (todos marcados completed)
- [ ] Code review hecho (code-reviewer agent)
```

### ✅ Antes de Deploy a Staging

```markdown
- [ ] Checklist de commit ↑ completado
- [ ] Security audit si toca auth/pagos (security-auditor)
- [ ] Documentation actualizada
- [ ] /security-audit ejecutado
```

### ✅ Antes de Deploy a Producción

```markdown
- [ ] Checklist de staging ↑ completado
- [ ] Testeado en staging mínimo 24h
- [ ] Segunda security audit hecha
- [ ] QA manual completado (qa-specialist)
- [ ] Rollback plan listo
```

## 🔗 Enlaces Externos Útiles

### Firebase
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Cloud Functions v2 Guide](https://firebase.google.com/docs/functions)

### Stripe
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)

### React & TypeScript
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Capacitor
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Deployment](https://capacitorjs.com/docs/ios)
- [Android Deployment](https://capacitorjs.com/docs/android)

## 🎓 Rutas de Aprendizaje

### Ruta 1: "Desarrollador Frontend"

**Foco:** React, UI, componentes

1. README.md
2. CLAUDE.md (secciones de React + Tailwind)
3. WORKFLOW_GUIDE.md (patterns de UI)
4. .claude/agents/code-reviewer.md
5. EXAMPLE_WORKFLOWS.md (workflow de perfiles)

### Ruta 2: "Desarrollador Backend/Cloud Functions"

**Foco:** Firebase, Cloud Functions, Stripe

1. README.md
2. CLAUDE.md (secciones de Firebase)
3. .claude/agents/cloud-functions-specialist.md
4. .claude/agents/security-auditor.md
5. MCP_SETUP.md (Firebase MCP)
6. EXAMPLE_WORKFLOWS.md (workflow de pagos)

### Ruta 3: "DevOps/Deployment"

**Foco:** CI/CD, deployment, monitoring

1. README.md
2. SETUP_GUIDE.md
3. .claude/agents/firebase-deployer.md
4. .claude/commands/deploy-*.md
5. MCP_SETUP.md (monitoring con MCP)

### Ruta 4: "QA/Testing"

**Foco:** Testing, quality assurance

1. README.md
2. CLAUDE.md (sección de testing)
3. .claude/agents/qa-specialist.md
4. .claude/agents/test-writer.md
5. BEST_PRACTICES.md (checklists de QA)

## 📞 Soporte y Ayuda

### ¿Dónde buscar ayuda?

1. **Este índice** - Encuentra el archivo relevante
2. **CLAUDE.md** - Guía técnica completa
3. **BEST_PRACTICES.md** - Patterns y soluciones comunes
4. **EXAMPLE_WORKFLOWS.md** - Ver casos reales

### ¿Cómo pedir ayuda a Claude?

```
❌ MAL: "Ayúdame con esto"

✅ BIEN: "Necesito implementar [feature específica].
         He leído [archivo relevante].
         Mi plan es [plan con TodoWrite].
         ¿Puedes revisar mi enfoque?"
```

## 🔄 Mantenimiento de Documentación

### Cuándo actualizar documentación:

- ✅ Después de agregar nueva feature importante
- ✅ Después de cambiar workflow o procesos
- ✅ Cuando se descubren mejores prácticas
- ✅ Después de resolver bugs complejos

### Archivos a actualizar típicamente:

- **CLAUDE.md** - Para cambios técnicos/arquitecturales
- **BEST_PRACTICES.md** - Para nuevos patterns
- **EXAMPLE_WORKFLOWS.md** - Para casos nuevos interesantes
- **README.md** - Para cambios en setup/quick start

## ✅ Verificación Final

**Antes de empezar a trabajar, asegúrate de:**

- [ ] Has leído README.md
- [ ] Entiendes el sistema de TodoWrite (.claude/TODOWRITE_POLICY.md)
- [ ] Sabes qué agentes usar (WORKFLOW_GUIDE.md)
- [ ] Conoces las best practices (BEST_PRACTICES.md)
- [ ] Has visto ejemplos similares (EXAMPLE_WORKFLOWS.md)
- [ ] Tienes MCP configurado (opcional pero recomendado)

---

**Este índice es tu mapa.** Úsalo para navegar toda la documentación del proyecto de forma eficiente.

**Recuerda:** TodoWrite SIEMPRE primero. No hay excepciones.
