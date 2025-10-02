import { onCall } from 'firebase-functions/v2/https';
import { beforeUserCreated } from 'firebase-functions/v2/identity';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import { User, CustomClaims } from '../types';
import { config } from '../config';

/**
 * Cloud Function: beforeUserCreated
 * Se ejecuta cuando se crea un nuevo usuario en Firebase Auth
 *
 * Responsabilidades:
 * 1. Crear documento en Firestore /users
 * 2. Asignar custom claims (role, isAnonymous)
 * 3. Inicializar puntos de lealtad
 */
export const onUserCreate = beforeUserCreated({
  region: config.region,
}, async (event) => {
  const user = event.data;
  if (!user) {
    logger.error('No user data in event');
    return;
  }

  const db = admin.firestore();

  try {
    // Determinar si es anónimo
    const isAnonymous = user.providerData.length === 0;

    // Rol inicial: guest si anónimo, client si registrado
    const defaultRole = isAnonymous ? 'guest' : 'client';

    // Verificar si ya existe el documento (en caso de upgrade guest → registered)
    const userDoc = await db.collection('users').doc(user.uid).get();

    if (userDoc.exists) {
      // Usuario ya existía (era guest), solo actualizar a registered
      logger.info(`User ${user.uid} already exists, updating from guest to client`);

      await db.collection('users').doc(user.uid).update({
        email: user.email || null,
        displayName: user.displayName || 'Usuario',
        photoURL: user.photoURL || null,
        phoneNumber: user.phoneNumber || null,
        role: 'client',
        isAnonymous: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Actualizar custom claims
      const claims: CustomClaims = {
        role: 'client',
        isAnonymous: false,
      };

      await admin.auth().setCustomUserClaims(user.uid, claims);

      logger.info(`User ${user.uid} upgraded from guest to client successfully`);
    } else {
      // Usuario nuevo, crear documento completo
      logger.info(`Creating new user ${user.uid} with role: ${defaultRole}`);

      const newUser: User = {
        id: user.uid,
        email: user.email || null,
        displayName: user.displayName || (isAnonymous ? 'Invitado' : 'Usuario'),
        photoURL: user.photoURL || null,
        phoneNumber: user.phoneNumber || null,
        role: defaultRole,
        isAnonymous,
        queuePoints: config.defaultUser.queuePoints,
        queueHistory: {
          totalCompleted: 0,
          totalNoShows: 0,
          totalExpired: 0,
          totalCancelled: 0,
        },
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      };

      await db.collection('users').doc(user.uid).set(newUser);

      // Asignar custom claims
      const claims: CustomClaims = {
        role: defaultRole,
        isAnonymous,
      };

      await admin.auth().setCustomUserClaims(user.uid, claims);

      logger.info(`User ${user.uid} created successfully with role: ${defaultRole}`);
    }
  } catch (error) {
    logger.error('Error creating/updating user:', error);
    throw error;
  }
});

/**
 * Callable Function: Update User Role
 * Permite a admins actualizar el rol de un usuario
 *
 * Parámetros:
 * - userId: string
 * - newRole: UserRole
 * - franchiseId?: string
 * - branchId?: string
 */
export const updateUserRole = onCall({
  region: config.region,
}, async (request) => {
  const { userId, newRole, franchiseId, branchId } = request.data;

  // Verificar auth
  if (!request.auth) {
    throw new Error('Usuario no autenticado');
  }

  // Verificar que sea super_admin o franchise_owner
  const callerRole = request.auth.token.role;
  if (callerRole !== 'super_admin' && callerRole !== 'franchise_owner') {
    throw new Error('No tienes permisos para actualizar roles');
  }

  try {
    const db = admin.firestore();

    // Actualizar documento en Firestore
    const updateData: Partial<User> = {
      role: newRole,
      updatedAt: admin.firestore.Timestamp.now(),
    };

    if (franchiseId) updateData.franchiseId = franchiseId;
    if (branchId) updateData.branchId = branchId;

    await db.collection('users').doc(userId).update(updateData);

    // Actualizar custom claims
    const claims: CustomClaims = {
      role: newRole,
      isAnonymous: false,
    };

    if (franchiseId) claims.franchiseId = franchiseId;
    if (branchId) claims.branchId = branchId;

    await admin.auth().setCustomUserClaims(userId, claims);

    logger.info(`User ${userId} role updated to ${newRole} by ${request.auth.uid}`);

    return { success: true, message: 'Rol actualizado correctamente' };
  } catch (error) {
    logger.error('Error updating user role:', error);
    throw new Error('Error actualizando rol');
  }
});
