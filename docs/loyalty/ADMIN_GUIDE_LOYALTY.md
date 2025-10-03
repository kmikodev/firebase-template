# Guía de Administración - Sistema de Tarjeta de Fidelización

**Versión:** 1.0
**Última actualización:** 3 de octubre de 2025
**Audiencia:** Barberos, Administradores de Sucursal, Administradores de Franquicia

---

## Índice

1. [Visión General del Sistema](#visión-general-del-sistema)
2. [Generación Automática de Sellos](#generación-automática-de-sellos)
3. [Aplicar Recompensas a la Cola](#aplicar-recompensas-a-la-cola)
4. [Restricciones y Validaciones](#restricciones-y-validaciones)
5. [Monitorear Actividad de Clientes](#monitorear-actividad-de-clientes)
6. [Gestión de Expiración](#gestión-de-expiración)
7. [Solución de Problemas](#solución-de-problemas)
8. [Configuración del Sistema](#configuración-del-sistema)

---

## Visión General del Sistema

### ¿Qué es el Sistema de Fidelización?

El sistema de tarjeta de fidelización es una herramienta automática para recompensar la lealtad de los clientes. Los clientes ganan **sellos** al completar servicios y reciben **recompensas gratuitas** al acumular suficientes sellos.

### Flujo del Sistema

```
1. Cliente completa servicio
   ↓
2. Barbero marca turno como "completado"
   ↓
3. Sistema genera sello automáticamente
   ↓
4. Si tiene suficientes sellos (ej. 10) → Sistema genera recompensa
   ↓
5. Cliente muestra código de recompensa
   ↓
6. Barbero aplica recompensa al siguiente turno
   ↓
7. Servicio marcado como gratis
```

### Roles y Permisos

| Rol | Ver Tarjetas | Aplicar Recompensas | Ajustes Manuales | Configurar Sistema |
|-----|--------------|---------------------|------------------|-------------------|
| **Barbero** | ✅ Clientes propios | ✅ En su sucursal | ❌ | ❌ |
| **Admin Sucursal** | ✅ Toda la sucursal | ✅ En su sucursal | ✅ Con aprobación | ❌ |
| **Admin Franquicia** | ✅ Toda la franquicia | ✅ Todas las sucursales | ✅ | ✅ |
| **Super Admin** | ✅ Todo el sistema | ✅ Sin restricciones | ✅ | ✅ |

---

## Generación Automática de Sellos

### Cómo Funciona

Los sellos se generan **completamente automáticos** cuando:

1. **Completas un turno** en el sistema (marcas como "completado")
2. **El servicio es elegible** (verificado por configuración)
3. **El cliente tiene cuenta activa**
4. **La franquicia tiene el sistema habilitado**

**No necesitas hacer nada adicional** - el sistema lo maneja por ti.

### Servicios Elegibles

Depende de la configuración de tu franquicia. Verifica con tu administrador qué servicios otorgan sellos.

**Configuración típica:**
- ✅ Corte de cabello
- ✅ Arreglo de barba
- ✅ Servicios combinados
- ❌ Productos de venta
- ❌ Servicios 100% gratuitos

### Validaciones Automáticas

El sistema verifica:
- ✅ Cliente autenticado
- ✅ Servicio especificado en el turno
- ✅ Barbero asignado al turno
- ✅ Servicio en lista de elegibles
- ✅ Sin sellos duplicados (idempotencia)

### Confirmación de Sello

**Cómo verificar que se creó el sello:**

1. Marca el turno como "completado"
2. Espera 2-3 segundos
3. Revisa la tarjeta del cliente en el sistema
4. Deberías ver el nuevo sello agregado

**Si no aparece:**
- Verifica que el servicio sea elegible
- Confirma que el turno está "completado" (no "en servicio")
- Revisa los logs del sistema (admins solamente)

### Generación de Recompensas

**Automático cuando el cliente alcanza el número requerido:**

Ejemplo: Si se requieren 10 sellos
- Cliente tiene 9 sellos activos
- Completas su servicio → +1 sello
- Total: 10 sellos → **Recompensa generada automáticamente**

**El cliente recibe:**
- Notificación en la app
- Código único de recompensa (ej. `RWD-A3B7C9D1E2F4`)
- La recompensa aparece en su tarjeta

**Los 10 sellos usados:**
- Se marcan como "usados en recompensa"
- Ya no cuentan para la siguiente recompensa
- Se archivan en el historial del cliente

---

## Aplicar Recompensas a la Cola

### Cuándo Aplicar una Recompensa

Un cliente con una recompensa generada puede canjearla en su próxima visita. Tu rol es **validar y aplicar** la recompensa al turno actual.

### Proceso Completo (Paso a Paso)

#### Paso 1: Cliente Muestra Código

El cliente abre su app y muestra el código de recompensa:

```
╔═══════════════════════════════╗
║  RECOMPENSA DISPONIBLE       ║
║                               ║
║  Código:                      ║
║  RWD-A3B7C9D1E2F4            ║
║                               ║
║  Servicio: Corte Gratis       ║
║  Expira: 15 Nov 2025          ║
╚═══════════════════════════════╝
```

#### Paso 2: Verificar Código en el Sistema

1. Abre el turno del cliente en la cola
2. Busca la opción "Aplicar Recompensa"
3. Ingresa el código mostrado por el cliente
4. El sistema valida automáticamente:
   - ✅ Código válido y activo
   - ✅ Pertenece a este cliente
   - ✅ No ha expirado
   - ✅ Es válido en esta sucursal/franquicia

#### Paso 3: Aplicar al Servicio

Si todas las validaciones pasan:

1. Selecciona "Aplicar Recompensa"
2. Confirma la acción
3. El sistema marca:
   - Recompensa → "Canjeada"
   - Servicio → Precio = 0 (GRATIS)
   - Turno → Tiene recompensa aplicada

#### Paso 4: Confirmar con el Cliente

- Muestra al cliente que el servicio es ahora gratis
- Procede con el servicio normalmente
- El cliente NO recibe sello en este servicio (ya que es gratis con recompensa)

### Interfaz de Aplicación (Ejemplo)

```
┌─────────────────────────────────────┐
│  APLICAR RECOMPENSA                 │
├─────────────────────────────────────┤
│                                     │
│  Cliente: Juan Pérez                │
│  Servicio: Corte de cabello         │
│  Precio original: 15.00 €           │
│                                     │
│  Código de recompensa:              │
│  [RWD-A3B7C9D1E2F4        ]        │
│                          [Verificar]│
│                                     │
│  ✅ Código válido                   │
│  ✅ Pertenece a este cliente        │
│  ✅ No expirado (15 días restantes) │
│  ✅ Válido en esta sucursal         │
│                                     │
│  Precio con recompensa: 0.00 € 🎉  │
│                                     │
│         [Aplicar]    [Cancelar]     │
└─────────────────────────────────────┘
```

### Confirmación en Pantalla

Después de aplicar:

```
✅ RECOMPENSA APLICADA

• Código: RWD-A3B7C9D1E2F4
• Descuento: 15.00 €
• Total a pagar: 0.00 €
• Aplicada por: Barbero María
• Fecha: 3 Oct 2025, 14:30
```

---

## Restricciones y Validaciones

### Permisos por Rol

#### Barberos
**Pueden:**
- ✅ Aplicar recompensas en su sucursal asignada
- ✅ Ver tarjetas de sus clientes
- ✅ Verificar códigos de recompensa

**NO pueden:**
- ❌ Aplicar recompensas en otras sucursales
- ❌ Crear/eliminar sellos manualmente
- ❌ Modificar configuración del sistema

**Validación automática:**
El sistema verifica que el barbero esté asignado a la sucursal del turno. Si intentas aplicar una recompensa en otra sucursal, recibirás:

```
❌ ERROR: No autorizado
No puedes aplicar recompensas en esta sucursal.
Estás asignado a: Sucursal Centro
Este turno es de: Sucursal Norte
```

#### Administradores de Sucursal
**Pueden:**
- ✅ Aplicar recompensas en cualquier turno de su sucursal
- ✅ Ver todas las tarjetas de clientes de la sucursal
- ✅ Solicitar ajustes manuales (con aprobación)

**NO pueden:**
- ❌ Aplicar en otras sucursales de la franquicia
- ❌ Modificar configuración global

#### Administradores de Franquicia / Super Admins
**Pueden:**
- ✅ Aplicar recompensas en cualquier sucursal de su franquicia
- ✅ Ver todas las tarjetas de la franquicia
- ✅ Realizar ajustes manuales
- ✅ Modificar configuración del sistema

### Validaciones del Sistema

Cuando aplicas una recompensa, el sistema valida automáticamente:

#### 1. **Recompensa Válida**
```
✅ Estado = "en uso" (el cliente ya validó el código)
❌ Estado = "canjeada" → Error: Ya fue usada
❌ Estado = "expirada" → Error: Recompensa vencida
```

#### 2. **Pertenencia al Cliente**
```
✅ recompensa.userId == turno.userId
❌ Usuario diferente → Error: Recompensa no pertenece a este cliente
```

#### 3. **Franquicia Correcta**
```
✅ recompensa.franchiseId == turno.franchiseId
❌ Franquicia diferente → Error: No válido en esta franquicia
```

#### 4. **Sin Recompensa Previa**
```
✅ Turno sin recompensa aplicada
❌ Ya tiene recompensa → Error: No puedes aplicar dos recompensas
```

#### 5. **Fecha de Expiración**
```
✅ Hoy < Fecha de expiración
❌ Recompensa expirada → Error: Vencida el [fecha]
```

### Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| "Recompensa no encontrada" | Código incorrecto | Verifica el código con el cliente |
| "Recompensa ya canjeada" | Cliente ya la usó | Muestra historial al cliente |
| "No autorizado en esta sucursal" | Barbero en sucursal incorrecta | Redirige a barbero de la sucursal |
| "Recompensa expirada" | Más de 30 días desde generación | Explica política de expiración |
| "No pertenece a este cliente" | Cliente muestra código ajeno | Verifica identidad del cliente |

---

## Monitorear Actividad de Clientes

### Ver Resumen de Cliente

Cada cliente tiene un **resumen de fidelización** que muestra:

```
╔════════════════════════════════════════╗
║  RESUMEN DE FIDELIZACIÓN               ║
║  Cliente: Juan Pérez (#12345)          ║
╟────────────────────────────────────────╢
║  📊 PROGRESO ACTUAL                     ║
║  • Sellos activos: 7                   ║
║  • Requeridos: 10                      ║
║  • Progreso: 70% [▓▓▓▓▓▓▓░░░]         ║
║                                        ║
║  🎁 RECOMPENSAS                         ║
║  • Disponibles: 1                      ║
║    - RWD-A3B7C9D1E2F4 (Expira: 15 Nov) ║
║  • Canjeadas: 3                        ║
║  • Expiradas: 0                        ║
║                                        ║
║  📈 ESTADÍSTICAS TOTALES                ║
║  • Total sellos ganados: 37            ║
║  • Último sello: 1 Oct 2025            ║
║  • Última recompensa: 20 Sep 2025      ║
╚════════════════════════════════════════╝
```

### Historial de Sellos

Puedes ver el historial completo de sellos del cliente:

| Fecha | Servicio | Barbero | Estado | Expira |
|-------|----------|---------|--------|--------|
| 1 Oct 2025 | Corte | María | ✅ Activo | 30 Dic 2025 |
| 15 Sep 2025 | Barba | Carlos | ✅ Activo | 15 Dic 2025 |
| 1 Sep 2025 | Corte | Juan | ⚪ Usado (Recompensa) | - |
| 20 Ago 2025 | Corte | María | ❌ Expirado | 19 Nov 2025 |

**Leyenda:**
- ✅ **Activo:** Cuenta para la próxima recompensa
- ⚪ **Usado:** Ya se usó para generar recompensa
- ❌ **Expirado:** Venció antes de usarse

### Historial de Recompensas

| Código | Estado | Generada | Canjeada | Barbero |
|--------|--------|----------|----------|---------|
| RWD-ABC123 | ✅ Disponible | 1 Oct 2025 | - | - |
| RWD-XYZ789 | ✅ Canjeada | 1 Sep 2025 | 15 Sep 2025 | María |
| RWD-DEF456 | ❌ Expirada | 1 Ago 2025 | - | - |

### Progreso Hacia Siguiente Recompensa

El sistema muestra visualmente el progreso:

```
Progreso: 7 de 10 sellos

[▓▓▓▓▓▓▓░░░] 70%

Faltan 3 sellos para la siguiente recompensa
```

### Información Útil para Atención al Cliente

Cuando un cliente pregunta sobre su tarjeta:

1. **Ver sellos activos:** Cuántos tiene ahora
2. **Ver próxima expiración:** Sellos/recompensas que vencen pronto
3. **Ver historial:** Servicios previos que otorgaron sellos
4. **Ver recompensas disponibles:** Cuáles puede canjear ahora

---

## Gestión de Expiración

### Proceso Automático Diario

El sistema ejecuta procesos automáticos cada noche:

#### 2:00 AM - Expiración de Sellos
- Busca sellos con fecha de expiración pasada
- Marca como "expirado"
- Actualiza resúmenes de clientes

#### 3:00 AM - Expiración de Recompensas
- Busca recompensas no canjeadas con fecha pasada
- Marca como "expirado"
- Actualiza resúmenes de clientes

**No requiere intervención manual** - es completamente automático.

### Políticas de Expiración

#### Sellos
- **Duración:** 90 días desde que se gana
- **Aviso al cliente:** 7 días antes de expirar
- **Acción al expirar:** Se marca como "expirado", no se elimina (queda en historial)

#### Recompensas
- **Duración:** 30 días desde que se genera
- **Aviso al cliente:** 7 días antes de expirar
- **Acción al expirar:** Se marca como "expirada", no se puede canjear

### Notificaciones a Clientes (Automáticas)

Si están habilitadas en la configuración:

**7 días antes de expiración:**
```
⚠️ AVISO DE EXPIRACIÓN

Tienes sellos/recompensas que vencen pronto:
• 3 sellos expiran el 15 de noviembre
• 1 recompensa expira el 20 de noviembre

¡Visítanos pronto para no perderlos!
```

**El día de expiración:**
- El cliente ve los sellos/recompensas como "expirados"
- Ya no cuentan para generar nuevas recompensas
- Quedan archivados en el historial

### Extensión de Recompensas (Futuro)

Actualmente NO es posible extender recompensas automáticamente.

**Ajuste manual (solo admins con aprobación):**
1. El cliente solicita extensión antes de la expiración
2. Admin evalúa el caso (ej: cliente leal, circunstancia especial)
3. Admin puede emitir una nueva recompensa manualmente
4. Se registra el ajuste con motivo en el sistema

---

## Solución de Problemas

### Problema 1: Recompensa no Aparece en el Sistema

**Síntomas:**
- Cliente dice tener recompensa
- No aparece al buscar por código
- Cliente muestra captura de pantalla

**Diagnóstico:**
1. Verifica el código exacto (mayúsculas/minúsculas)
2. Confirma la franquicia del cliente
3. Revisa historial de recompensas del cliente
4. Verifica fecha de expiración

**Posibles causas:**
- ❌ **Código incorrecto:** Cliente escribió mal
- ❌ **Recompensa expirada:** Más de 30 días desde generación
- ❌ **Franquicia incorrecta:** Cliente en franquicia diferente
- ❌ **Ya canjeada:** Cliente la usó y no recuerda

**Solución:**
- Si expiró injustamente → Escala a admin para ajuste manual
- Si código incorrecto → Busca en historial del cliente
- Si ya canjeada → Muestra historial como evidencia

### Problema 2: No Puedo Aplicar Recompensa en Turno

**Error común:**
```
❌ No puedes aplicar recompensas en esta sucursal
```

**Causa:** Eres barbero y el turno es de otra sucursal

**Solución:**
1. Verifica tu sucursal asignada
2. Verifica la sucursal del turno
3. Si es diferente → Pide a un barbero de esa sucursal que aplique
4. O contacta a un admin que tiene acceso a todas las sucursales

### Problema 3: Cliente Reclama Sellos Faltantes

**Síntomas:**
- Cliente dice completó servicio
- No recibió sello
- Pasaron más de 24 horas

**Diagnóstico:**
1. Revisa historial de turnos del cliente
2. Verifica si el turno está marcado como "completado"
3. Revisa si el servicio es elegible para sellos
4. Verifica logs del sistema (admins)

**Posibles causas:**
- ❌ **Turno no completado:** Barbero olvidó marcar como completado
- ❌ **Servicio no elegible:** Servicio no otorga sellos
- ❌ **Error del sistema:** Poco común, revisar logs

**Solución:**
- Si turno no completado → Márcalo ahora (puede generar sello retroactivo)
- Si servicio no elegible → Explica política al cliente
- Si error del sistema → Admin puede agregar sello manual con auditoría

### Problema 4: Recompensa Aplicada por Error

**Síntomas:**
- Aplicaste recompensa al turno incorrecto
- Cliente no quería usarla todavía
- Código ingresado por error

**Importante:** Una vez aplicada, **NO se puede deshacer automáticamente**

**Solución (solo admins):**
1. Contacta a tu supervisor inmediatamente
2. Admin puede emitir nueva recompensa manual
3. Se registra el incidente en el sistema
4. Cliente recibe recompensa de reemplazo

**Prevención:**
- Confirma el código con el cliente ANTES de aplicar
- Verifica que el cliente quiera usar la recompensa ahora
- No ingreses códigos sin autorización del cliente

### Problema 5: Sistema Lento al Aplicar Recompensa

**Síntomas:**
- Botón "Aplicar" tarda más de 10 segundos
- Aplicación se congela
- Error de timeout

**Diagnóstico:**
1. Verifica conexión a internet
2. Verifica estado del servidor Firebase (status.firebase.google.com)
3. Revisa logs de errores en consola

**Solución inmediata:**
- Espera hasta 30 segundos (transacciones complejas)
- NO presiones el botón múltiples veces (evita duplicados)
- Si timeout → Refresca y verifica si se aplicó antes de reintentar

**Solución a largo plazo:**
- Reporta lentitud persistente a soporte técnico
- Puede requerir optimización de índices o infraestructura

---

## Configuración del Sistema

### Acceso a Configuración (Solo Admins)

**Ubicación:**
Configuración → Fidelización → Configuración de Franquicia

### Parámetros Configurables

#### 1. **Activación del Sistema**
```
[ ✓ ] Sistema de fidelización habilitado
```
- Activa/desactiva todo el sistema
- Si se desactiva: No se generan sellos nuevos, pero recompensas existentes siguen válidas

#### 2. **Sellos Requeridos**
```
Sellos requeridos para recompensa: [ 10 ]
```
- Define cuántos sellos necesita el cliente para generar recompensa
- Valor típico: 10 (rango: 5-20)

#### 3. **Expiración de Sellos**
```
[ ✓ ] Sellos expiran
Días hasta expiración: [ 90 ]
```
- Define si los sellos expiran
- Si sí, cuántos días hasta expirar
- Valor típico: 90 días

#### 4. **Expiración de Recompensas**
```
[ ✓ ] Recompensas expiran
Días hasta expiración: [ 30 ]
```
- Define si las recompensas expiran
- Si sí, cuántos días desde generación
- Valor típico: 30 días

#### 5. **Servicios Elegibles**
```
Modo: ( ) Todos los servicios
      (•) Servicios específicos

Servicios que otorgan sellos:
[ ✓ ] Corte de cabello
[ ✓ ] Arreglo de barba
[ ✓ ] Corte + Barba
[   ] Productos
[   ] Servicios gratis
```
- Elige qué servicios otorgan sellos
- Recomendado: Solo servicios pagados principales

#### 6. **Canje Entre Sucursales**
```
[ ✓ ] Permitir canjear en cualquier sucursal de la franquicia
```
- Si activado: Cliente puede canjear en cualquier sucursal
- Si desactivado: Solo en la sucursal donde ganó los sellos

#### 7. **Notificaciones**
```
Notificar al cliente cuando:
[ ✓ ] Gana un sello
[ ✓ ] Genera una recompensa
[ ✓ ] Recompensa/sello por expirar (7 días antes)
```
- Define qué notificaciones reciben los clientes

#### 8. **Políticas Avanzadas**
```
[ ✓ ] Prevenir auto-sellos (barberos no ganan sellos en sus propios servicios)
[   ] Permitir sellos en servicios gratuitos
```

### Ejemplo de Configuración Recomendada

```yaml
Configuración Óptima para Barbería Pequeña/Mediana:

✅ Sistema habilitado: Sí
✅ Sellos requeridos: 10
✅ Expiración de sellos: 90 días
✅ Expiración de recompensas: 30 días
✅ Servicios elegibles: Corte, Barba, Corte+Barba (no productos)
✅ Canje entre sucursales: Sí (si tienes múltiples sucursales)
✅ Notificaciones: Todas habilitadas
✅ Prevenir auto-sellos: Sí (siempre)
❌ Sellos en servicios gratis: No
```

### Impacto de Cambios de Configuración

⚠️ **Importante:** Algunos cambios NO afectan sellos/recompensas existentes

**Cambios con efecto inmediato:**
- ✅ Activar/desactivar sistema
- ✅ Servicios elegibles (para nuevos sellos)
- ✅ Notificaciones

**Cambios que NO afectan existentes:**
- ❌ Cambiar sellos requeridos (solo afecta nuevos clientes)
- ❌ Cambiar días de expiración (sellos existentes mantienen fecha original)

**Ejemplo:**
```
Hoy: Cambias de 10 a 8 sellos requeridos

Cliente A (tiene 7 sellos viejos):
  → Necesita 3 más (sigue con requisito de 10)

Cliente B (empieza hoy):
  → Necesita 8 sellos (usa nuevo requisito)
```

### Auditoría de Cambios

Todos los cambios de configuración se registran:

| Fecha | Admin | Cambio | Valor Anterior | Valor Nuevo |
|-------|-------|--------|----------------|-------------|
| 1 Oct 2025 | María | Sellos requeridos | 10 | 8 |
| 15 Sep 2025 | Juan | Expiración sellos | 60 días | 90 días |

---

## Mejores Prácticas

### Para Barberos

✅ **Hacer:**
- Confirma con el cliente antes de aplicar recompensa
- Verifica el código cuidadosamente
- Explica al cliente que no recibirá sello en servicio gratis
- Registra cualquier problema en el sistema de tickets

❌ **No hacer:**
- No apliques recompensas sin autorización del cliente
- No ingreses códigos de memoria (siempre pide que lo muestren)
- No intentes aplicar recompensas en sucursales donde no estás asignado

### Para Administradores

✅ **Hacer:**
- Revisa actividad de fidelización semanalmente
- Monitorea tasa de expiración (alta expiración = clientes insatisfechos)
- Ajusta configuración basada en feedback de clientes
- Capacita a barberos regularmente sobre el sistema

❌ **No hacer:**
- No cambies configuración sin planificación
- No hagas ajustes manuales sin documentar el motivo
- No desactives el sistema abruptamente (avisa a clientes primero)

### KPIs a Monitorear

| Métrica | Valor Ideal | Acción si Fuera de Rango |
|---------|-------------|--------------------------|
| Tasa de recompensas canjeadas | >80% | <80%: Reducir días de expiración o promocionar |
| Tasa de sellos expirados | <20% | >20%: Aumentar días de expiración |
| Tiempo promedio para completar tarjeta | 3-6 meses | >6 meses: Reducir sellos requeridos |
| Clientes activos con sellos | >60% | <60%: Promocionar sistema más |

---

## Soporte Técnico

### Escalación de Problemas

**Nivel 1 - Barbero:**
- Problemas básicos de aplicación
- Códigos incorrectos
- Dudas de clientes

**Nivel 2 - Admin Sucursal:**
- Ajustes manuales (con justificación)
- Problemas recurrentes
- Configuración de sucursal

**Nivel 3 - Admin Franquicia:**
- Cambios de configuración global
- Problemas técnicos del sistema
- Integraciones y reportes avanzados

**Nivel 4 - Soporte Técnico:**
- Bugs del sistema
- Problemas de rendimiento
- Migraciones de datos

### Contacto

📧 **Email:** soporte@sistema-fidelizacion.com
📱 **Teléfono:** +34 XXX XXX XXX
💬 **Chat:** Disponible en el panel de admin

**Horario:**
- Lunes a Viernes: 9:00 AM - 8:00 PM
- Sábados: 10:00 AM - 2:00 PM
- Urgencias: 24/7 (solo para problemas críticos)

---

**¡Usa el sistema de fidelización para aumentar la lealtad de tus clientes!** 🎉
