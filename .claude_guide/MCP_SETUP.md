# 🔌 Configuración de MCP Servers

Esta guía explica cómo configurar los servidores MCP (Model Context Protocol) para potenciar aún más Claude Code en este proyecto.

## 📦 MCP Servers Recomendados para Firebase + Capacitor

### 1. Firebase MCP Server (Altamente Recomendado)

Permite a Claude interactuar directamente con Firebase.

**Instalación:**

```bash
npm install -g @firebase/mcp-server
```

**Configuración en `~/.claude/mcp_settings.json`:**

```json
{
  "mcpServers": {
    "firebase": {
      "command": "firebase-mcp-server",
      "args": [
        "--project-id", "your-firebase-project-id"
      ],
      "env": {
        "FIREBASE_SERVICE_ACCOUNT": "/path/to/serviceAccountKey.json"
      }
    }
  }
}
```

**Capacidades que añade:**

- 🔥 Leer/escribir en Firestore directamente
- 👤 Gestionar usuarios de Firebase Auth
- 📦 Subir/descargar archivos de Storage
- 📊 Ver analytics en tiempo real
- 🔍 Inspeccionar security rules
- 📝 Ver logs de Cloud Functions

**Ejemplo de uso:**

```
> Using Firebase MCP, check if there are any errors in Cloud Functions logs from the last hour

> Using Firebase MCP, create a test user with email test@example.com

> Using Firebase MCP, show me the 10 most recent documents in the users collection
```

### 2. GitHub MCP Server (Para CI/CD)

Interactúa con GitHub para PRs, issues, y actions.

**Instalación:**

```bash
npm install -g @modelcontextprotocol/server-github
```

**Configuración en `~/.claude/mcp_settings.json`:**

```json
{
  "mcpServers": {
    "github": {
      "command": "mcp-server-github",
      "env": {
        "GITHUB_TOKEN": "ghp_your_github_token_here"
      }
    }
  }
}
```

**Capacidades que añade:**

- 📝 Crear y gestionar issues
- 🔀 Crear PRs
- ✅ Ver status de GitHub Actions
- 🏷️ Gestionar labels y milestones
- 👥 Revisar PRs
- 📊 Ver estadísticas del repo

**Ejemplo de uso:**

```
> Using GitHub MCP, create an issue titled "Implement dark mode" with the firebase-architect agent's architecture proposal

> Using GitHub MCP, check the status of the latest GitHub Actions workflow

> Using GitHub MCP, create a PR for the current branch with a summary of changes
```

### 3. Stripe MCP Server (Para Pagos)

Interactúa con Stripe API para testear pagos.

**Instalación:**

```bash
npm install -g @stripe/mcp-server
```

**Configuración en `~/.claude/mcp_settings.json`:**

```json
{
  "mcpServers": {
    "stripe": {
      "command": "stripe-mcp-server",
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_your_test_key_here"
      }
    }
  }
}
```

**Capacidades que añade:**

- 💳 Crear test payment intents
- 🔔 Ver webhooks recibidos
- 👤 Gestionar test customers
- 💰 Ver transacciones
- 🔄 Simular eventos (refunds, disputes)

**Ejemplo de uso:**

```
> Using Stripe MCP, create a test payment intent for $10 and show me the client secret

> Using Stripe MCP, list the last 10 webhook events received

> Using Stripe MCP, simulate a successful payment for customer cus_test123
```

### 4. Filesystem MCP Server (Ya incluido)

Ya viene con Claude Code, pero es importante saber usarlo.

**Capacidades:**

- 📁 Leer/escribir archivos
- 🔍 Buscar en código
- 📂 Navegar directorios
- ✏️ Editar archivos

**Ya está configurado automáticamente.**

### 5. PostgreSQL/MySQL MCP Server (Opcional)

Si necesitas bases de datos relacionales además de Firestore.

**Instalación:**

```bash
npm install -g @modelcontextprotocol/server-postgres
```

**Configuración en `~/.claude/mcp_settings.json`:**

```json
{
  "mcpServers": {
    "postgres": {
      "command": "mcp-server-postgres",
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://user:pass@localhost:5432/dbname"
      }
    }
  }
}
```

## 🎯 Configuración Completa Recomendada

**Archivo `~/.claude/mcp_settings.json` completo:**

```json
{
  "mcpServers": {
    "firebase": {
      "command": "firebase-mcp-server",
      "args": [
        "--project-id", "my-app-dev"
      ],
      "env": {
        "FIREBASE_SERVICE_ACCOUNT": "/Users/you/.firebase/serviceAccountKey-dev.json"
      }
    },
    "github": {
      "command": "mcp-server-github",
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    },
    "stripe": {
      "command": "stripe-mcp-server",
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_your_key_here",
        "STRIPE_WEBHOOK_SECRET": "whsec_your_secret_here"
      }
    }
  }
}
```

## 🚀 Workflows Potenciados con MCP

### Ejemplo 1: Deploy y Monitoreo

```markdown
**Sin MCP:**
> /deploy-staging
[Deploy manual]
[Revisar logs manualmente en Firebase Console]

**Con Firebase MCP:**
> /deploy-staging
> Using Firebase MCP, monitor Cloud Functions logs for errors in the last 5 minutes
> Using Firebase MCP, check if there are any failed authentications
> Using Firebase MCP, show me Firestore usage stats
```

### Ejemplo 2: Debugging de Pagos

```markdown
**Sin MCP:**
> /test-payment-flow
[Testear manualmente]
[Revisar Stripe Dashboard]

**Con Stripe + Firebase MCP:**
> Using Stripe MCP, create a test payment for $25
> [Payment intent created: pi_test_123]
> Using Firebase MCP, check if payment pi_test_123 was recorded in Firestore
> Using Firebase MCP, show me the transaction document
> Using Stripe MCP, verify webhook was received and processed
```

### Ejemplo 3: Feature completa con MCP

```markdown
**TodoWrite:**
1. Diseñar feature con firebase-architect
2. Crear GitHub issue con descripción
3. Implementar código
4. Crear tests en Firestore (usando MCP)
5. Testear pagos (usando Stripe MCP)
6. Crear PR automáticamente
7. Deploy y monitoreo

**Ejecución:**

[Todo 1] > Use firebase-architect agent...
[Todo 2] > Using GitHub MCP, create issue "User Profile Feature" with the architecture from firebase-architect
[Todo 3] [Implementar código]
[Todo 4] > Using Firebase MCP, create test users for testing
[Todo 5] > Using Stripe MCP, create test payment intent
[Todo 6] > Using GitHub MCP, create PR with summary of changes
[Todo 7] > /deploy-staging && Using Firebase MCP, monitor logs
```

## 🔐 Seguridad de MCP

### Mejores Prácticas:

1. **Usa diferentes proyectos Firebase para dev/staging/prod**
   ```json
   "firebase-dev": { "args": ["--project-id", "my-app-dev"] },
   "firebase-prod": { "args": ["--project-id", "my-app-prod"] }
   ```

2. **Nunca uses keys de producción en MCP**
   - Stripe: Usa solo `sk_test_*`
   - GitHub: Usa token con permisos limitados

3. **Protege tus credentials**
   ```bash
   chmod 600 ~/.claude/mcp_settings.json
   # Nunca commitees este archivo
   ```

4. **Usa service accounts con permisos mínimos**
   - Firebase: Solo lectura para monitoreo
   - Solo escritura cuando sea absolutamente necesario

## 🎓 Cómo Yo (Claude) uso MCP

### Durante Desarrollo:

```markdown
1. **Análisis de requisitos**: No uso MCP
   > Use requirements-analyst agent

2. **Diseño de arquitectura**: Firebase MCP para ver estructura actual
   > Using Firebase MCP, show me the current Firestore collections
   > Use firebase-architect agent to design new data model

3. **Implementación**: No uso MCP (escribo código)

4. **Testing**: Firebase + Stripe MCP
   > Using Firebase MCP, create 10 test users
   > Using Stripe MCP, test payment flow

5. **Deployment**: Firebase MCP para monitoring
   > /deploy-staging
   > Using Firebase MCP, monitor logs for errors
```

### Durante Debugging:

```markdown
1. **Reproducir bug**: QA specialist + Firebase MCP
   > Use qa-specialist to create reproduction steps
   > Using Firebase MCP, check if error is in logs

2. **Analizar datos**: Firebase MCP
   > Using Firebase MCP, show me the user document for userId_123
   > Using Firebase MCP, check last 100 failed auth attempts

3. **Fix y verificar**: Code + Firebase MCP
   [Implementar fix]
   > Using Firebase MCP, verify the fix worked
```

## 📊 Integración MCP + Agentes

**Estrategia óptima:**

```
Agentes = Análisis + Diseño + Planificación
MCP = Ejecución + Verificación + Monitoreo
```

**Ejemplo:**

```markdown
> Use firebase-architect agent to design payment data model
[Agent diseña modelo]

> Using Firebase MCP, create the collections and indexes based on the architecture
[MCP crea estructura]

> Use cloud-functions-specialist agent to implement payment function
[Agent guía implementación]

> Using Stripe MCP, test the payment function
[MCP testea]

> Using Firebase MCP, verify payment was recorded correctly
[MCP verifica]
```

## ✅ Checklist de Setup

- [ ] Instalar Firebase MCP Server
- [ ] Crear service account de Firebase (solo lectura)
- [ ] Configurar Firebase MCP en `mcp_settings.json`
- [ ] Testear: `> Using Firebase MCP, list collections`

- [ ] Instalar GitHub MCP Server
- [ ] Crear GitHub token con permisos limitados
- [ ] Configurar GitHub MCP en `mcp_settings.json`
- [ ] Testear: `> Using GitHub MCP, list open issues`

- [ ] Instalar Stripe MCP Server
- [ ] Obtener test keys de Stripe
- [ ] Configurar Stripe MCP en `mcp_settings.json`
- [ ] Testear: `> Using Stripe MCP, create test payment intent`

## 🎯 Comandos MCP Útiles

### Firebase MCP

```
# Monitoring
> Using Firebase MCP, show Cloud Functions errors from last hour
> Using Firebase MCP, check Firestore usage today
> Using Firebase MCP, list active users

# Data Management
> Using Firebase MCP, create test user with email test@example.com
> Using Firebase MCP, show document users/user123
> Using Firebase MCP, list all collections

# Analytics
> Using Firebase MCP, show daily active users
> Using Firebase MCP, check function invocation count
```

### Stripe MCP

```
# Testing
> Using Stripe MCP, create payment intent for $50
> Using Stripe MCP, list test customers
> Using Stripe MCP, simulate payment success

# Monitoring
> Using Stripe MCP, show last 10 webhooks
> Using Stripe MCP, list failed payments today
> Using Stripe MCP, check customer subscription status
```

### GitHub MCP

```
# Issues
> Using GitHub MCP, create issue with firebase-architect's proposal
> Using GitHub MCP, list open bugs
> Using GitHub MCP, assign issue #42 to developer

# PRs
> Using GitHub MCP, create PR for current branch
> Using GitHub MCP, check CI status for PR #15
> Using GitHub MCP, list PRs waiting for review
```

---

Con MCP configurado, tendrás superpoderes adicionales para desarrollo, testing, y deployment. Combina MCP con los agentes especializados para máxima productividad.
