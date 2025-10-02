# Requerimientos Técnicos: App Turnos Peluquerías Multitenant

## 1. User Stories Principales (MVP)

### US1: Sacar Turno (Cliente)
**Como** cliente
**Quiero** sacar un turno desde mi app antes de llegar a la peluquería
**Para** no esperar físicamente en el local

**Criterios de aceptación:**
- Puedo ver sucursales cercanas con turnos disponibles
- Puedo elegir peluquero específico O cola general
- Debo seleccionar servicio (corte, barba, etc.)
- Veo estimación de tiempo de espera
- Solo puedo sacar turno si quedan máximo 1-2 personas antes que yo
- Recibo confirmación y notificación de estimación

### US2: Gestionar Cola en Tiempo Real (Peluquero)
**Como** peluquero
**Quiero** llamar al siguiente cliente automáticamente desde mi app
**Para** mantener fluida la atención

**Criterios de aceptación:**
- Veo mi cola actual en tiempo real
- Puedo marcar cliente como "atendiendo" y "finalizado"
- Si cliente no llega en 5 min, se salta automáticamente
- Veo servicios solicitados y duración estimada

### US3: Configurar Sucursal (Admin Sucursal)
**Como** admin de sucursal
**Quiero** configurar horarios, peluqueros y límites de cola
**Para** operar mi sucursal eficientemente

**Criterios de aceptación:**
- Puedo definir horarios de operación
- Puedo agregar/pausar peluqueros
- Puedo configurar límite de cola (ej: máximo 10 turnos)
- Puedo definir descansos y ausencias

### US4: Administrar Franquicia (Franquiciado)
**Como** franquiciado
**Quiero** ver dashboard consolidado de mis sucursales
**Para** monitorear operación y KPIs

**Criterios de aceptación:**
- Veo sucursales de mi franquicia
- Veo estadísticas: turnos atendidos, cancelados, ratings
- Puedo crear nuevas sucursales
- Puedo asignar admins de sucursal

### US5: Sistema de Penalización (Cliente)
**Como** sistema
**Quiero** penalizar clientes que no lleguen a tiempo
**Para** desincentivar comportamiento irresponsable

**Criterios de aceptación:**
- Cliente tiene 10 min para llegar tras sacar turno
- Si no llega, pierde puntos
- Después de X faltas, restricción temporal de sacar turnos

### US6: Notificaciones de Estado (Cliente/Peluquero)
**Como** cliente
**Quiero** recibir notificaciones de mi turno
**Para** saber cuándo llegar

**Criterios de aceptación:**
- Notificación al confirmar turno
- Notificación cuando falten 2 turnos
- Notificación cuando sea mi turno
- Notificación si fui saltado

### US7: Gestión Multitenancy (Super Admin)
**Como** super admin
**Quiero** administrar franquicias y configuración global
**Para** escalar la plataforma

**Criterios de aceptación:**
- Puedo crear/editar/eliminar franquicias
- Puedo asignar franquiciados
- Veo métricas globales de la plataforma

---

## 2. Casos de Uso Core

### CU1: Sacar Turno FIFO

**Actores:** Cliente, Sistema
**Precondiciones:** Cliente autenticado (guest o registrado), sucursal operativa
**Flujo principal:**

1. Cliente abre app y busca sucursales cercanas
2. Sistema muestra sucursales con disponibilidad
3. Cliente selecciona sucursal
4. Sistema muestra opciones: peluqueros específicos o cola general
5. Cliente selecciona opción y servicio
6. Sistema valida límite de cola (máx 1-2 turnos antes)
7. Si disponible, sistema asigna turno con estimación de tiempo
8. Sistema notifica cliente: "Tu turno será en ~20 min"
9. Sistema inicia timer de 10 min para que cliente llegue

**Flujo alternativo 1:** Cola llena
- 6a. Sistema muestra mensaje "Cola llena, intenta más tarde"

**Flujo alternativo 2:** Cliente no llega en 10 min
- 9a. Sistema cancela turno automáticamente
- 9b. Sistema resta puntos al cliente
- 9c. Sistema notifica cliente de cancelación

**Postcondiciones:** Turno creado, cliente en cola, timer activo

---

### CU2: Atender Turno (Peluquero)

**Actores:** Peluquero, Sistema
**Precondiciones:** Turno asignado en cola
**Flujo principal:**

1. Peluquero ve lista de turnos en su app
2. Sistema muestra próximo cliente con servicio solicitado
3. Peluquero llama cliente manualmente O sistema llama automáticamente
4. Cliente tiene 5 min de gracia para presentarse
5. Si llega, peluquero marca "Atendiendo"
6. Al finalizar, peluquero marca "Finalizado"
7. Sistema solicita rating al cliente
8. Sistema llama automáticamente siguiente turno

**Flujo alternativo 1:** Cliente no llega en 5 min
- 4a. Sistema marca cliente como "no show"
- 4b. Sistema salta al siguiente turno
- 4c. Sistema resta puntos al cliente

**Flujo alternativo 2:** Peluquero en descanso
- 1a. Peluquero marca "Descanso" en app
- 1b. Sistema pausa asignación de nuevos turnos

**Postcondiciones:** Turno completado, estadísticas actualizadas

---

### CU3: Gestionar Sucursal (Admin)

**Actores:** Admin Sucursal
**Precondiciones:** Admin autenticado con permisos
**Flujo principal:**

1. Admin accede a dashboard de sucursal
2. Admin configura:
   - Horarios de operación (ej: Lun-Sáb 9-20h)
   - Peluqueros activos (alta/baja)
   - Servicios disponibles con duración y precio
   - Límite de cola (ej: máx 15 turnos)
3. Sistema valida configuración
4. Sistema aplica cambios en tiempo real

**Postcondiciones:** Configuración actualizada, reflejada en app de clientes

---

## 3. Matriz de Permisos

| Acción | Super Admin | Franquiciado | Admin Sucursal | Peluquero | Cliente |
|--------|------------|--------------|----------------|-----------|---------|
| **Franquicias** |
| Crear/Editar/Eliminar franquicia | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver franquicias propias | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Sucursales** |
| Crear/Editar sucursales | ✅ | ✅ | ✅ (solo suya) | ❌ | ❌ |
| Ver sucursales | ✅ | ✅ (propias) | ✅ (suya) | ✅ (suya) | ✅ (todas) |
| **Usuarios** |
| Asignar franquiciados | ✅ | ❌ | ❌ | ❌ | ❌ |
| Asignar admin sucursal | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gestionar peluqueros | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Turnos** |
| Sacar turno | ❌ | ❌ | ❌ | ❌ | ✅ |
| Atender turno | ❌ | ❌ | ❌ | ✅ | ❌ |
| Cancelar turno | ✅ | ✅ | ✅ | ❌ | ✅ (propio, 1h antes) |
| **Configuración** |
| Horarios/Servicios | ✅ | ✅ | ✅ | ❌ | ❌ |
| Precios | ✅ | ✅ | ✅ | ❌ | ❌ |
| Límite de cola | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Reportes** |
| Dashboard global | ✅ | ❌ | ❌ | ❌ | ❌ |
| Dashboard franquicia | ✅ | ✅ | ❌ | ❌ | ❌ |
| Dashboard sucursal | ✅ | ✅ | ✅ | ✅ | ❌ |
| Historial personal | ❌ | ❌ | ❌ | ✅ (propio) | ✅ (propio) |

---

## 4. Reglas de Negocio

### 4.1 Sistema de Turnos FIFO

| Regla | Detalle |
|-------|---------|
| **Límite de anticipación** | Cliente solo puede sacar turno si hay máximo 1-2 personas antes que él |
| **Timer de llegada** | 10 minutos desde que saca el turno para llegar al local |
| **Gracia de presentación** | 5 minutos desde que es llamado para presentarse en el box |
| **Cancelación anticipada** | Mínimo 1 hora antes para cancelar sin penalización |
| **Límite de cola** | Configurable por sucursal (ej: 10-20 turnos máx) |
| **Estimación de tiempo** | Basada en duración de servicios pendientes |

### 4.2 Sistema de Puntos y Penalizaciones

| Comportamiento | Consecuencia |
|----------------|--------------|
| **No llega en 10 min** | -10 puntos, turno cancelado |
| **No llega tras ser llamado (5 min)** | -15 puntos, saltado en cola |
| **Cancela con menos de 1h** | -5 puntos |
| **Completa turno** | +1 punto |
| **Puntaje < 0** | Restricción temporal (ej: 24-48h sin sacar turnos) |

### 4.3 Operación de Peluqueros

| Regla | Detalle |
|-------|---------|
| **Horarios** | Configurables por día de semana |
| **Descansos** | Pausan asignación automática de turnos |
| **Ausencias** | Requieren aprobación de admin, turnos reasignados |
| **Cola específica** | Cliente puede elegir peluquero, se suma a su cola particular |
| **Cola general** | Cliente entra en pool compartido, asignado al próximo disponible |

### 4.4 Servicios

| Regla | Detalle |
|-------|---------|
| **Duración estimada** | Usada para calcular tiempo de espera |
| **Precios** | Configurables por sucursal (pueden variar entre franquicias) |
| **Selección obligatoria** | Cliente debe elegir servicio al sacar turno |

---

## 5. Flujo FIFO Detallado

### Concepto: "1-2 Turnos Antes"

**Escenario:** Sucursal con cola de 8 turnos, límite configurado en 10 turnos.

| Acción | Estado de Cola | ¿Puede Cliente Nuevo Sacar Turno? |
|--------|----------------|-----------------------------------|
| Inicio | 0 turnos | ✅ Sí (quedan 10 espacios) |
| 8 clientes sacan turno | 8 turnos | ✅ Sí (quedan 2 espacios) |
| 9º cliente intenta | 8 turnos | ✅ Sí (queda 1 espacio) |
| 10º cliente intenta | 9 turnos | ✅ Sí (último espacio) |
| 11º cliente intenta | 10 turnos | ❌ No (cola llena) |

**Lógica:**
```
disponibilidad = limite_cola - turnos_actuales
puede_sacar_turno = disponibilidad >= 1
```

### Timeline Típico de un Turno

```
T=0: Cliente saca turno → Estimación: "Tu turno en ~20 min"
T=0-10min: Timer de llegada activo → Cliente debe llegar al local
T=10min: Cliente llega al local → Se posiciona físicamente
T=15min: Quedan 2 turnos antes → Notificación: "Faltan 2 clientes"
T=18min: Queda 1 turno antes → Notificación: "Eres el siguiente"
T=20min: Es su turno → Notificación: "Es tu turno, preséntate"
T=20-25min: Gracia de 5 min → Cliente debe presentarse en box
T=25min: Si no llegó → Sistema lo salta, -15 puntos
```

### Flujo de Excepciones

**Caso 1: Cliente no llega en 10 min (timer de llegada)**
```
T=0: Saca turno
T=10min: Timer expira → Turno cancelado, -10 puntos, notificación enviada
```

**Caso 2: Cliente llega pero no se presenta en box (gracia 5 min)**
```
T=20min: Es su turno, notificación enviada
T=21-25min: Cliente no se presenta
T=25min: Sistema salta turno, -15 puntos, siguiente cliente llamado
```

**Caso 3: Cliente cancela con anticipación**
```
T=0: Saca turno para T=20min
T=15min: Cancela (más de 1h restante) → Sin penalización
T=19:30: Cancela (menos de 1h) → -5 puntos
```

---

## 6. Arquitectura Multitenant

### 6.1 Modelo de Datos

**Jerarquía:**
```
Platform (Super Admin)
  └── Franchise (Franquiciado)
        └── Branch (Sucursal)
              └── Barber (Peluquero)
                    └── Appointments (Turnos)
```

**Clientes:** Entidad global, pueden usar cualquier franquicia/sucursal

### 6.2 Separación de Datos

| Entidad | Scope | Compartida Entre Franquicias |
|---------|-------|------------------------------|
| **Cliente** | Global | ✅ Sí (mismo user_id en todas) |
| **Franquicia** | Aislada | ❌ No |
| **Sucursal** | Dentro de franquicia | ❌ No |
| **Peluquero** | Dentro de sucursal | ❌ No |
| **Turno** | Dentro de sucursal | ❌ No |
| **Historial cliente** | Global | ✅ Sí (ve turnos en todas las franquicias) |

### 6.3 Casos de Uso Multitenant

**Caso 1:** Cliente Juan usa Franquicia A (Buenos Aires) y Franquicia B (Córdoba)
- Mismo user_id, misma cuenta
- Historial unificado muestra turnos en ambas ciudades
- Sistema de puntos es GLOBAL (si falla en Buenos Aires, afecta su score en Córdoba)

**Caso 2:** Franquicia A y B tienen servicios con precios diferentes
- Cada sucursal configura sus propios precios
- Cliente ve precio específico de la sucursal elegida

**Decisión de diseño:** Sistema de puntos global para evitar que clientes problemáticos se muevan entre franquicias.

---

## 7. Decisiones Pendientes

### 7.1 Sistema de Pagos

**Opciones:**
- **Digital (Online):** Pago al sacar turno, integración Stripe/MercadoPago
- **Presencial:** Pago en local, solo registro de transacción
- **Híbrido:** Cliente elige método

**Preguntas abiertas:**
- ¿Pago obligatorio al sacar turno o solo reserva?
- ¿Reembolso automático si cliente cancela con anticipación?
- ¿Propina digital para peluqueros?

**Impacto técnico:**
- Cloud Functions para webhooks de Stripe
- Firestore: colección `payments` con estado de transacciones
- Security Rules: solo admins ven datos de pagos

---

### 7.2 Plataformas y Experiencia de Usuario

**Pendiente definir:**

| Usuario | ¿Web? | ¿iOS? | ¿Android? |
|---------|-------|-------|-----------|
| **Cliente** | ? | ? | ? |
| **Peluquero** | ? | ✅ (prioritario) | ✅ (prioritario) |
| **Admin Sucursal** | ✅ | ✅ | ✅ |
| **Franquiciado** | ✅ | Opcional | Opcional |
| **Super Admin** | ✅ | ❌ | ❌ |

**Recomendación MVP:**
- Cliente: App móvil (iOS + Android) con Capacitor
- Peluquero: App móvil (iOS + Android)
- Admins: Dashboard web responsive (accesible desde mobile)

**Decisión crítica:** Si clientes solo usan mobile, no gastar recursos en web cliente.

---

### 7.3 Idiomas y Localización

**Pendiente:**
- ¿Multi-país desde MVP o solo Argentina?
- ¿Multi-idioma (ES/EN/PT) o solo español?
- ¿Diferentes zonas horarias?

**Impacto técnico:**
- Firestore: campo `language` en usuarios
- i18n con react-i18next
- Notificaciones: plantillas por idioma

---

### 7.4 Notificaciones Push

**Pendiente:**
- ¿Prioridad: Push notifications o SMS?
- ¿Email como fallback?

**Recomendación:**
- MVP: Push notifications (Firebase Cloud Messaging)
- Futuro: SMS para casos críticos ("es tu turno")

---

## Resumen Ejecutivo MVP

**Scope mínimo para lanzar:**

✅ **Incluir:**
- CRUD usuarios (5 roles)
- Turnos FIFO con límite de 1-2 antes
- Timers: 10 min llegada, 5 min gracia
- Sistema de puntos básico
- Notificaciones push (confirmación, tu turno, saltado)
- Dashboard admins (web)
- App móvil peluqueros
- Multitenant: franquicias independientes, clientes globales

❌ **Dejar para v2:**
- Pagos digitales
- Reportes avanzados
- Multi-idioma
- Integración con sistemas externos

**Riesgo técnico alto:**
- Sincronización en tiempo real de colas (usar Firestore real-time listeners)
- Manejo de timers en Cloud Functions (usar scheduled functions)

**Escalabilidad:** Arquitectura serverless Firebase soporta objetivo de 500 franquicias.
