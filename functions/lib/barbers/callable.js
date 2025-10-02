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
exports.deleteBarber = exports.updateBarber = exports.createBarber = void 0;
/**
 * Barber Management - Callable Functions
 */
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const config_1 = require("../config");
const db = admin.firestore();
const auth = admin.auth();
/**
 * Create Barber - Creates a new barber user and document
 *
 * Only super_admin can create barbers
 */
exports.createBarber = (0, https_1.onCall)({
    region: config_1.config.region,
}, async (request) => {
    // Check authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Check if user is super_admin
    const userRole = request.auth.token.role;
    if (userRole !== 'super_admin') {
        throw new https_1.HttpsError('permission-denied', 'Only super admins can create barbers');
    }
    const { email, password, displayName, franchiseId, branchId, specialties, bio, photoURL, } = request.data;
    // Validate required fields
    if (!email || !password || !displayName || !franchiseId || !branchId) {
        throw new https_1.HttpsError('invalid-argument', 'email, password, displayName, franchiseId, and branchId are required');
    }
    try {
        // 1. Create Firebase Auth user
        const userRecord = await auth.createUser({
            email,
            password,
            displayName,
            photoURL: photoURL || undefined,
        });
        v2_1.logger.info('Firebase Auth user created', { uid: userRecord.uid, email });
        // 2. Set custom claims (role: barber)
        await auth.setCustomUserClaims(userRecord.uid, {
            role: 'barber',
            franchiseId,
            branchId,
        });
        v2_1.logger.info('Custom claims set', { uid: userRecord.uid, role: 'barber' });
        // 3. Create barber document in Firestore
        const barberRef = db.collection('barbers').doc();
        const barberId = barberRef.id;
        // Default schedule (Monday to Saturday 9:00-21:00, Sunday closed)
        const defaultSchedule = {
            monday: { isWorking: true, workStart: '09:00', workEnd: '21:00' },
            tuesday: { isWorking: true, workStart: '09:00', workEnd: '21:00' },
            wednesday: { isWorking: true, workStart: '09:00', workEnd: '21:00' },
            thursday: { isWorking: true, workStart: '09:00', workEnd: '21:00' },
            friday: { isWorking: true, workStart: '09:00', workEnd: '21:00' },
            saturday: { isWorking: true, workStart: '09:00', workEnd: '21:00' },
            sunday: { isWorking: false },
        };
        await barberRef.set({
            barberId,
            userId: userRecord.uid,
            franchiseId,
            branchId,
            displayName,
            photoURL: photoURL || '',
            specialties: specialties || ['haircut'],
            bio: bio || '',
            schedule: defaultSchedule,
            isActive: true,
            isAvailable: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        v2_1.logger.info('Barber document created', { barberId, userId: userRecord.uid });
        // 4. Create user profile document
        await db.collection('users').doc(userRecord.uid).set({
            userId: userRecord.uid,
            email,
            displayName,
            photoURL: photoURL || '',
            role: 'barber',
            franchiseId,
            branchId,
            loyaltyPoints: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        v2_1.logger.info('User profile created', { userId: userRecord.uid });
        return {
            success: true,
            barberId,
            userId: userRecord.uid,
            message: 'Barber created successfully',
        };
    }
    catch (error) {
        v2_1.logger.error('Error creating barber:', error);
        // If error, clean up (delete auth user if created)
        // Note: Barber doc might not be created yet, so we don't need to delete it
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        // Handle specific Firebase Auth errors
        if (error.code === 'auth/email-already-exists') {
            throw new https_1.HttpsError('already-exists', 'A user with this email already exists');
        }
        if (error.code === 'auth/invalid-email') {
            throw new https_1.HttpsError('invalid-argument', 'Invalid email address');
        }
        if (error.code === 'auth/weak-password') {
            throw new https_1.HttpsError('invalid-argument', 'Password is too weak (minimum 6 characters)');
        }
        throw new https_1.HttpsError('internal', 'Failed to create barber');
    }
});
/**
 * Update Barber - Updates barber information
 *
 * super_admin can update any barber
 * barber can update their own info
 */
exports.updateBarber = (0, https_1.onCall)({
    region: config_1.config.region,
}, async (request) => {
    // Check authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { barberId, updates } = request.data;
    const userId = request.auth.uid;
    const userRole = request.auth.token.role;
    if (!barberId) {
        throw new https_1.HttpsError('invalid-argument', 'barberId is required');
    }
    try {
        const barberDoc = await db.collection('barbers').doc(barberId).get();
        if (!barberDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Barber not found');
        }
        const barber = barberDoc.data();
        // Check permissions (super_admin or own barber)
        const isSuperAdmin = userRole === 'super_admin';
        const isOwnBarber = (barber === null || barber === void 0 ? void 0 : barber.userId) === userId;
        if (!isSuperAdmin && !isOwnBarber) {
            throw new https_1.HttpsError('permission-denied', 'Not authorized to update this barber');
        }
        // Prepare allowed updates
        const allowedUpdates = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        // Fields that can be updated
        const allowedFields = [
            'displayName',
            'photoURL',
            'specialties',
            'bio',
            'schedule',
            'isActive',
            'isAvailable',
        ];
        // Only super_admin can update certain fields
        const superAdminOnlyFields = ['franchiseId', 'branchId', 'isActive'];
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                // Check if field is super_admin only
                if (superAdminOnlyFields.includes(field) && !isSuperAdmin) {
                    throw new https_1.HttpsError('permission-denied', `Only super admins can update ${field}`);
                }
                allowedUpdates[field] = updates[field];
            }
        }
        await barberDoc.ref.update(allowedUpdates);
        v2_1.logger.info('Barber updated successfully', {
            barberId,
            updatedBy: userId,
        });
        return {
            success: true,
            message: 'Barber updated successfully',
        };
    }
    catch (error) {
        v2_1.logger.error('Error updating barber:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to update barber');
    }
});
/**
 * Delete Barber - Deletes a barber (soft delete by setting isActive=false)
 *
 * Only super_admin can delete barbers
 */
exports.deleteBarber = (0, https_1.onCall)({
    region: config_1.config.region,
}, async (request) => {
    // Check authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Check if user is super_admin
    const userRole = request.auth.token.role;
    if (userRole !== 'super_admin') {
        throw new https_1.HttpsError('permission-denied', 'Only super admins can delete barbers');
    }
    const { barberId } = request.data;
    if (!barberId) {
        throw new https_1.HttpsError('invalid-argument', 'barberId is required');
    }
    try {
        const barberDoc = await db.collection('barbers').doc(barberId).get();
        if (!barberDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Barber not found');
        }
        // Soft delete (set isActive to false)
        await barberDoc.ref.update({
            isActive: false,
            isAvailable: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        v2_1.logger.info('Barber deleted (soft)', {
            barberId,
            deletedBy: request.auth.uid,
        });
        return {
            success: true,
            message: 'Barber deleted successfully',
        };
    }
    catch (error) {
        v2_1.logger.error('Error deleting barber:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to delete barber');
    }
});
//# sourceMappingURL=callable.js.map