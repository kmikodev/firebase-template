# 🧪 Test de Notificaciones - Script Rápido

## ✅ **Verificación Previa (30 segundos)**

**Abre la consola del navegador (F12) y ejecuta esto:**

```javascript
// Script de diagnóstico completo
async function verifyNotificationSetup() {
  console.log('🔍 VERIFICACIÓN DE NOTIFICACIONES\n');

  // 1. Verificar permisos
  const permission = Notification.permission;
  console.log('1. Permisos:', permission);
  if (permission === 'granted') {
    console.log('   ✅ Permisos concedidos');
  } else {
    console.log('   ❌ PROBLEMA: Permisos no concedidos');
    console.log('   SOLUCIÓN: Haz clic en el banner azul o ejecuta:');
    console.log('   Notification.requestPermission()');
    return;
  }

  // 2. Verificar service worker
  const regs = await navigator.serviceWorker.getRegistrations();
  console.log('\n2. Service Workers:', regs.length);
  if (regs.length > 0) {
    regs.forEach(reg => {
      console.log('   ✅ SW registrado:', reg.scope);
      console.log('   Estado:', reg.active ? 'ACTIVO' : 'INACTIVO');
    });
  } else {
    console.log('   ❌ PROBLEMA: No hay service workers');
    return;
  }

  // 3. Verificar FCM token en localStorage
  const token = localStorage.getItem('fcm_token');
  console.log('\n3. FCM Token:');
  if (token) {
    console.log('   ✅ Token existe:', token.substring(0, 30) + '...');
    console.log('   Longitud:', token.length, 'caracteres');
  } else {
    console.log('   ⚠️  ADVERTENCIA: Token no en localStorage');
    console.log('   (Puede estar solo en Firestore, esto está OK)');
  }

  // 4. Test de notificación local
  console.log('\n4. Test de notificación local:');
  try {
    const testNotif = new Notification('Test Notification', {
      body: 'Si ves esto, las notificaciones funcionan',
      icon: 'https://comprakitsupervivencia.web.app/vite.svg'
    });
    console.log('   ✅ Notificación de test enviada');
    console.log('   ¿La viste aparecer en tu pantalla?');
  } catch (err) {
    console.log('   ❌ Error al enviar notificación:', err.message);
  }

  // 5. Resumen
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMEN:');
  if (permission === 'granted' && regs.length > 0) {
    console.log('✅ Sistema LISTO para recibir notificaciones');
    console.log('\n🎯 PRÓXIMO PASO:');
    console.log('   Ve a "Client Queue" → "Sacar Turno"');
    console.log('   Deberías recibir notificación en 1-2 segundos');
  } else {
    console.log('❌ Sistema NO está listo');
    console.log('   Revisa los errores arriba');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Ejecutar verificación
verifyNotificationSetup();
```

---

## 🎯 **Resultado Esperado**

Deberías ver:

```
🔍 VERIFICACIÓN DE NOTIFICACIONES

1. Permisos: granted
   ✅ Permisos concedidos

2. Service Workers: 1
   ✅ SW registrado: https://comprakitsupervivencia.web.app/
   Estado: ACTIVO

3. FCM Token:
   ✅ Token existe: cB3KJZz3M2rFN_I6I7ReDs:APA91b...
   Longitud: 163 caracteres

4. Test de notificación local:
   ✅ Notificación de test enviada
   ¿La viste aparecer en tu pantalla?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN:
✅ Sistema LISTO para recibir notificaciones

🎯 PRÓXIMO PASO:
   Ve a "Client Queue" → "Sacar Turno"
   Deberías recibir notificación en 1-2 segundos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🧪 **Test de Notificación Real (1 minuto)**

### Paso a Paso:

1. **Abre la app:** https://comprakitsupervivencia.web.app

2. **Ve a Client Queue**

3. **Haz clic en "Sacar Turno"**

4. **Espera 1-2 segundos**

5. **Deberías ver:**
   - 🔔 Notificación del navegador con:
     - Título: "Ticket Confirmado"
     - Mensaje: "Tu ticket {número} ha sido confirmado"
     - Ícono de la app

### ¿Qué Hacer Si NO Llega?

**Inmediatamente después de sacar el turno, ejecuta esto en consola:**

```javascript
// Ver si hubo errores
console.log('Últimas 5 entradas de consola');

// Verificar que el servicio realmente tomó el turno
fetch('https://europe-west1-comprakitsupervivencia.cloudfunctions.net/getUserActiveTicketHTTP', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: firebase.auth().currentUser.uid
  })
})
.then(r => r.json())
.then(data => {
  console.log('Ticket activo:', data);
  if (data.ticket) {
    console.log('✅ Ticket creado:', data.ticket.ticketNumber);
    console.log('   Estado:', data.ticket.status);
    console.log('   Creado:', new Date(data.ticket.createdAt._seconds * 1000).toLocaleString());
  } else {
    console.log('❌ No hay ticket activo');
  }
})
.catch(err => console.error('Error:', err));
```

---

## 📋 **Checklist Rápido**

Antes de sacar turno, verifica:

- [ ] Ejecuté el script de verificación
- [ ] Veo ✅ "Sistema LISTO para recibir notificaciones"
- [ ] Vi la notificación de test local
- [ ] Estoy en la página correcta (Client Queue)
- [ ] Estoy logueado (no como guest)

---

## 🆘 **Solución Rápida Si Falla**

**Reset completo (1 minuto):**

```javascript
// 1. Desregistrar service workers
(async () => {
  const regs = await navigator.serviceWorker.getRegistrations();
  for (const reg of regs) {
    await reg.unregister();
  }
  console.log('✅ Service workers desregistrados');

  // 2. Limpiar localStorage
  localStorage.clear();
  console.log('✅ LocalStorage limpiado');

  // 3. Recargar
  console.log('Recargando en 2 segundos...');
  setTimeout(() => window.location.reload(), 2000);
})();
```

Después de recargar:
1. Acepta permisos cuando aparezca el banner azul
2. Espera a ver "Notifications enabled successfully" en consola
3. Ejecuta el script de verificación de nuevo
4. Si dice "Sistema LISTO", saca un turno

---

## 📊 **Verificar en Firebase (Logs)**

**En terminal, ejecuta:**

```bash
firebase functions:log --only onQueueCreate --lines 20
```

**Busca la última entrada con tu ticket:**

```json
{
  "message": "Notification sent",
  "successCount": 1,  // ← Debe ser 1
  "failureCount": 0   // ← Debe ser 0 (si es 1, token inválido)
}
```

**Si ves `failureCount: 1`:**
```json
{
  "message": "Removed invalid tokens",
  "count": 1
}
```

Significa que el token es inválido. **Solución:**
1. Ejecuta el reset completo arriba
2. Acepta permisos de nuevo
3. Espera a que se genere nuevo token
4. Intenta de nuevo

---

## ✅ **Estado Actual del Sistema**

**Última verificación:** 2025-10-02 20:04

**FCM Token actual:** `cB3KJZz3M2rFN_I6I7ReDs:APA91bE...`

**Todo configurado:**
- ✅ Permissions: `granted`
- ✅ Service Worker: `registered`
- ✅ FCM Token: `saved to Firestore`
- ✅ Firestore Index: `deployed`
- ✅ Cloud Functions: `active`

**LISTO PARA PROBAR** 🚀

---

## 📞 **Si Necesitas Ayuda**

1. Ejecuta el script de verificación
2. Copia la salida completa de consola
3. Ejecuta `firebase functions:log --only onQueueCreate --lines 20`
4. Comparte ambas salidas

---

**Última actualización:** 2025-10-02 20:04
**Status:** 🟢 READY FOR TESTING
