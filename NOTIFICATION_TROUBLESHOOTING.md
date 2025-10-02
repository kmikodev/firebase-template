# Push Notifications Troubleshooting Guide

## 🎉 **ESTADO ACTUAL: SISTEMA OPERATIVO**

**Última verificación:** 2025-10-02 20:01

✅ **Sistema configurado correctamente:**
- Notification permission: `granted`
- Service worker: `registered`
- FCM token: `cqG8aHhXLDXiYocAeFjs2e:APA91b...` (guardado en Firestore)
- Firestore index: `deployed` (`queues` collection)

**El sistema está listo para enviar notificaciones.** Si creaste un ticket después de las 20:01 y NO recibiste notificación, ve a la sección "Diagnóstico Rápido" abajo.

---

## 🔍 Diagnóstico Rápido

### Paso 1: Verificar Estado en el Navegador

Abre la consola del navegador (F12) y ejecuta:

```javascript
// 1. Verificar permisos de notificación
console.log('Notification permission:', Notification.permission);

// 2. Verificar service worker
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service workers:', regs.length);
  regs.forEach(reg => console.log('SW scope:', reg.scope));
});

// 3. Verificar FCM token en localStorage
console.log('FCM token stored:', localStorage.getItem('fcm_token'));
```

**Resultado esperado:**
```
Notification permission: "granted"
Service workers: 1
SW scope: "https://comprakitsupervivencia.web.app/"
FCM token stored: "dV_..."
```

---

## 🐛 Problema Identificado

### Síntomas
- Las notificaciones no llegan
- Logs muestran: `"failureCount":1, "Removed invalid tokens"`

### Causa Root
**El token FCM está siendo rechazado por Firebase** porque:
1. El usuario NO concedió permisos de notificación
2. El service worker no está registrado correctamente
3. El token se generó con VAPID key incorrecto
4. El navegador bloqueó las notificaciones

---

## ✅ Soluciones

### Solución 1: Verificar y Solicitar Permisos

**En la app:**

1. Abre https://comprakitsupervivencia.web.app
2. Busca el banner azul "Habilitar notificaciones"
3. Haz clic en "Habilitar"
4. Acepta en el prompt del navegador

**Si no aparece el banner:**

Abre consola (F12) y ejecuta:

```javascript
// Solicitar permisos manualmente
Notification.requestPermission().then(permission => {
  console.log('Permission:', permission);
  if (permission === 'granted') {
    console.log('✅ Permisos concedidos!');
    // Recarga la página para registrar token
    window.location.reload();
  } else {
    console.log('❌ Permisos denegados');
  }
});
```

### Solución 2: Verificar Service Worker

**Verificar en DevTools:**

1. F12 → Application tab → Service Workers
2. Deberías ver: `firebase-messaging-sw.js` - **Activated and running**

**Si no está registrado:**

```javascript
// Registrar manualmente
navigator.serviceWorker.register('/firebase-messaging-sw.js')
  .then(reg => {
    console.log('✅ Service worker registered:', reg);
    window.location.reload();
  })
  .catch(err => console.error('❌ SW registration failed:', err));
```

### Solución 3: Generar Nuevo Token FCM

**En consola del navegador:**

```javascript
// Importar Firebase Messaging
import { getMessaging, getToken } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';

// Obtener instancia de messaging
const messaging = firebase.messaging();

// VAPID key (reemplaza con tu key)
const VAPID_KEY = 'BN1fm6Nvs1m3UQtHFiQooL44COo3btJmXmXV0iI9qxjTU3SBfYzopoLRS3ehMKI4UtN0_jjNdgP9vWhTihit79Y';

// Generar token
getToken(messaging, { vapidKey: VAPID_KEY })
  .then(token => {
    console.log('✅ FCM Token:', token);

    // Guardar token en Firestore manualmente
    const userId = 'TU_USER_ID';  // Reemplaza con tu userId
    fetch(`https://europe-west1-comprakitsupervivencia.cloudfunctions.net/saveFCMToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token })
    });
  })
  .catch(err => console.error('❌ Error getting token:', err));
```

### Solución 4: Limpiar Cache y Registros

**Pasos:**

1. **Desregistrar service workers:**
   ```javascript
   navigator.serviceWorker.getRegistrations().then(regs => {
     regs.forEach(reg => reg.unregister());
     console.log('✅ Service workers unregistered');
   });
   ```

2. **Limpiar cache:**
   - F12 → Application → Clear storage
   - Check "Unregister service workers"
   - Check "Cache storage"
   - Check "Local storage"
   - Click "Clear site data"

3. **Recargar página:**
   ```javascript
   window.location.reload();
   ```

4. **Volver a solicitar permisos** (ver Solución 1)

---

## 🧪 Pruebas

### Test 1: Verificar Token en Firestore

**Abre Firebase Console:**
https://console.firebase.google.com/project/comprakitsupervivencia/firestore/data

**Navega a:**
```
users / {tu_userId} / fcmTokens / {tokenId}
```

**Deberías ver:**
```json
{
  "token": "dV_...",
  "device": {
    "userAgent": "Mozilla/5.0...",
    "platform": "Linux x86_64"
  },
  "createdAt": "2025-10-02T...",
  "lastUsedAt": "2025-10-02T..."
}
```

**Si NO existe:**
- El token nunca se guardó
- Sigue los pasos de Solución 1 y 3

### Test 2: Enviar Notificación de Prueba

**Desde Firebase Console:**

1. Ve a: https://console.firebase.google.com/project/comprakitsupervivencia/notification
2. Click "New notification"
3. Notification title: "Test"
4. Notification text: "Probando notificaciones"
5. Target: "User segment" → "All users"
6. Send "Test message" primero
7. Ingresa tu FCM token (de consola o Firestore)
8. Click "Test"

**Si llega:**
✅ FCM está funcionando, el problema es la integración

**Si NO llega:**
❌ Problema con permisos o service worker

### Test 3: Verificar Logs de Cloud Functions

```bash
firebase functions:log --only onQueueCreate --lines 10
```

**Buscar:**
```json
{
  "message": "Notification sent",
  "successCount": 1,  // ← Debe ser > 0
  "failureCount": 0   // ← Debe ser 0
}
```

**Si `failureCount > 0`:**
- Token inválido o expirado
- Regenerar token (Solución 3)

---

## 🔧 Debug Avanzado

### Verificar VAPID Key

**La VAPID key debe coincidir en:**

1. **Frontend (.env):**
   ```
   VITE_FIREBASE_VAPID_KEY=BN1fm6Nvs1m3UQtHFiQooL44COo3btJmXmXV0iI9qxjTU3SBfYzopoLRS3ehMKI4UtN0_jjNdgP9vWhTihit79Y
   ```

2. **Firebase Console:**
   - Settings → Cloud Messaging → Web Push certificates
   - Key pair debe ser el mismo

**Si no coinciden:**
1. Copia el correcto del Console
2. Actualiza `.env`
3. Rebuild: `npm run build`
4. Deploy: `firebase deploy --only hosting`

### Verificar Configuración del Service Worker

**Archivo:** `public/firebase-messaging-sw.js`

**Debe tener:**
```javascript
firebase.initializeApp({
  apiKey: "AIzaSyAz3jmKK1JRT3Fmk1U1PDOkbfhVen0sPvo",
  authDomain: "comprakitsupervivencia.firebaseapp.com",
  projectId: "comprakitsupervivencia",
  // ... resto de config
});
```

**Probar manualmente:**

1. Abre: https://comprakitsupervivencia.web.app/firebase-messaging-sw.js
2. Debe cargar sin error 404
3. Debe contener `firebase.initializeApp`

---

## 📋 Checklist de Verificación

### Navegador
- [ ] Notification.permission === "granted"
- [ ] Service worker registrado
- [ ] FCM token generado
- [ ] Token guardado en Firestore

### Firebase Console
- [ ] VAPID key configurado
- [ ] Cloud Messaging habilitado
- [ ] Users/{userId}/fcmTokens existe
- [ ] Token no está expirado

### Aplicación
- [ ] Banner de permisos se muestra
- [ ] Botón "Habilitar" funciona
- [ ] AuthContext llama getFCMToken()
- [ ] No hay errores en consola

### Cloud Functions
- [ ] onQueueCreate se ejecuta
- [ ] sendNotificationToUser se llama
- [ ] successCount > 0
- [ ] failureCount === 0

---

## 🆘 Solución Rápida (5 minutos)

**Si nada funciona, reseteo completo:**

```javascript
// 1. Desregistrar todo
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});

// 2. Limpiar localStorage
localStorage.clear();

// 3. Limpiar permisos (en navegador)
// Settings → Privacy → Site Settings → Notifications
// Busca comprakitsupervivencia.web.app y borra

// 4. Recargar y aceptar permisos
window.location.reload();
```

---

## 🎯 Casos Comunes

### Caso 1: "No me aparece el banner de permisos"

**Causa:** Los permisos ya fueron denegados anteriormente

**Solución:**
1. Settings del navegador → Privacy → Notifications
2. Busca comprakitsupervivencia.web.app
3. Cambia a "Allow"
4. Recarga la página

### Caso 2: "El banner aparece pero no hace nada"

**Causa:** Error en el código de solicitud de permisos

**Solución:**
```javascript
// Ejecutar en consola
Notification.requestPermission().then(perm => {
  console.log('Permission:', perm);
  if (perm === 'granted') location.reload();
});
```

### Caso 3: "Las notificaciones llegan pero no se ven"

**Causa:** Service worker no está manejando background messages

**Solución:**
1. Verifica que `public/firebase-messaging-sw.js` existe
2. Verifica que tiene `onBackgroundMessage` handler
3. Despliega de nuevo: `firebase deploy --only hosting`

### Caso 4: "successCount:1 pero no veo notificación"

**Causa:** La notificación se envió pero el navegador no la mostró

**Solución:**
1. Verifica que el navegador no está en "Do not disturb"
2. Verifica que las notificaciones del navegador están habilitadas en el sistema operativo
3. Prueba en ventana de incógnito

---

## 📞 Verificación Final

**Ejecuta este script completo de diagnóstico:**

```javascript
async function diagnosticNotifications() {
  console.log('🔍 DIAGNOSTIC START');
  console.log('-------------------');

  // 1. Permisos
  console.log('1. Notification permission:', Notification.permission);

  // 2. Service Worker
  const regs = await navigator.serviceWorker.getRegistrations();
  console.log('2. Service workers:', regs.length);
  regs.forEach(reg => console.log('   - Scope:', reg.scope));

  // 3. FCM Token
  const fcmToken = localStorage.getItem('fcm_token');
  console.log('3. FCM token:', fcmToken ? '✅ Present' : '❌ Missing');

  // 4. Firebase app initialized
  console.log('4. Firebase app:', typeof firebase !== 'undefined' ? '✅ Loaded' : '❌ Not loaded');

  // 5. Auth state
  if (typeof firebase !== 'undefined' && firebase.auth) {
    const user = firebase.auth().currentUser;
    console.log('5. Current user:', user ? `✅ ${user.uid}` : '❌ Not logged in');
  }

  console.log('-------------------');
  console.log('🔍 DIAGNOSTIC END');

  // Recomendaciones
  if (Notification.permission !== 'granted') {
    console.log('⚠️  FIX: Run Notification.requestPermission()');
  }
  if (regs.length === 0) {
    console.log('⚠️  FIX: Register service worker');
  }
  if (!fcmToken) {
    console.log('⚠️  FIX: Generate FCM token');
  }
}

// Ejecutar
diagnosticNotifications();
```

---

## 📖 Documentación de Referencia

- **FCM Web Setup:** https://firebase.google.com/docs/cloud-messaging/js/client
- **Service Workers:** https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **Notification API:** https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API

---

**Última actualización:** 2025-10-02
