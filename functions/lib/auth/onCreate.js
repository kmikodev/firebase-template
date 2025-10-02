"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRole = exports.onUserCreate = void 0;
const https_1 = require("firebase-functions/v2/https");
const identity_1 = require("firebase-functions/v2/identity");
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
const config_1 = require("../config");
/**
 * Cloud Function: beforeUserCreated
 * Se ejecuta cuando se crea un nuevo usuario en Firebase Auth
 *
 * Responsabilidades:
 * 1. Crear documento en Firestore /users
 * 2. Asignar custom claims (role, isAnonymous)
 * 3. Inicializar puntos de lealtad
 */
exports.onUserCreate = (0, identity_1.beforeUserCreated)({
    region: config_1.config.region,
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
            const claims = {
                role: 'client',
                isAnonymous: false,
            };
            await admin.auth().setCustomUserClaims(user.uid, claims);
            logger.info(`User ${user.uid} upgraded from guest to client successfully`);
        }
        else {
            // Usuario nuevo, crear documento completo
            logger.info(`Creating new user ${user.uid} with role: ${defaultRole}`);
            const newUser = {
                id: user.uid,
                email: user.email || null,
                displayName: user.displayName || (isAnonymous ? 'Invitado' : 'Usuario'),
                photoURL: user.photoURL || null,
                phoneNumber: user.phoneNumber || null,
                role: defaultRole,
                isAnonymous,
                queuePoints: config_1.config.defaultUser.queuePoints,
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
            const claims = {
                role: defaultRole,
                isAnonymous,
            };
            await admin.auth().setCustomUserClaims(user.uid, claims);
            logger.info(`User ${user.uid} created successfully with role: ${defaultRole}`);
        }
    }
    catch (error) {
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
exports.updateUserRole = (0, https_1.onCall)({
    region: config_1.config.region,
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
        const updateData = {
            role: newRole,
            updatedAt: admin.firestore.Timestamp.now(),
        };
        if (franchiseId)
            updateData.franchiseId = franchiseId;
        if (branchId)
            updateData.branchId = branchId;
        await db.collection('users').doc(userId).update(updateData);
        // Actualizar custom claims
        const claims = {
            role: newRole,
            isAnonymous: false,
        };
        if (franchiseId)
            claims.franchiseId = franchiseId;
        if (branchId)
            claims.branchId = branchId;
        await admin.auth().setCustomUserClaims(userId, claims);
        logger.info(`User ${userId} role updated to ${newRole} by ${request.auth.uid}`);
        return { success: true, message: 'Rol actualizado correctamente' };
    }
    catch (error) {
        logger.error('Error updating user role:', error);
        throw new Error('Error actualizando rol');
    }
});
//# sourceMappingURL=onCreate.js.map