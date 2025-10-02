/**
 * Barber Management - Callable Functions
 */
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { config } from '../config';

const db = admin.firestore();
const auth = admin.auth();

/**
 * Create Barber - Creates a new barber user and document
 *
 * Only super_admin can create barbers
 */
export const createBarber = onCall({
  region: config.region,
}, async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  // Check if user is super_admin
  const userRole = request.auth.token.role;
  if (userRole !== 'super_admin') {
    throw new HttpsError(
      'permission-denied',
      'Only super admins can create barbers'
    );
  }

  const {
    email,
    password,
    displayName,
    franchiseId,
    branchId,
    specialties,
    bio,
    photoURL,
  } = request.data;

  // Validate required fields
  if (!email || !password || !displayName || !franchiseId || !branchId) {
    throw new HttpsError(
      'invalid-argument',
      'email, password, displayName, franchiseId, and branchId are required'
    );
  }

  try {
    // 1. Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      photoURL: photoURL || undefined,
    });

    logger.info('Firebase Auth user created', { uid: userRecord.uid, email });

    // 2. Set custom claims (role: barber)
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'barber',
      franchiseId,
      branchId,
    });

    logger.info('Custom claims set', { uid: userRecord.uid, role: 'barber' });

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

    logger.info('Barber document created', { barberId, userId: userRecord.uid });

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

    logger.info('User profile created', { userId: userRecord.uid });

    return {
      success: true,
      barberId,
      userId: userRecord.uid,
      message: 'Barber created successfully',
    };
  } catch (error: any) {
    logger.error('Error creating barber:', error);

    // If error, clean up (delete auth user if created)
    // Note: Barber doc might not be created yet, so we don't need to delete it

    if (error instanceof HttpsError) {
      throw error;
    }

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError(
        'already-exists',
        'A user with this email already exists'
      );
    }

    if (error.code === 'auth/invalid-email') {
      throw new HttpsError(
        'invalid-argument',
        'Invalid email address'
      );
    }

    if (error.code === 'auth/weak-password') {
      throw new HttpsError(
        'invalid-argument',
        'Password is too weak (minimum 6 characters)'
      );
    }

    throw new HttpsError(
      'internal',
      'Failed to create barber'
    );
  }
});

/**
 * Update Barber - Updates barber information
 *
 * super_admin can update any barber
 * barber can update their own info
 */
export const updateBarber = onCall({
  region: config.region,
}, async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { barberId, updates } = request.data;
  const userId = request.auth.uid;
  const userRole = request.auth.token.role;

  if (!barberId) {
    throw new HttpsError(
      'invalid-argument',
      'barberId is required'
    );
  }

  try {
    const barberDoc = await db.collection('barbers').doc(barberId).get();

    if (!barberDoc.exists) {
      throw new HttpsError(
        'not-found',
        'Barber not found'
      );
    }

    const barber = barberDoc.data();

    // Check permissions (super_admin or own barber)
    const isSuperAdmin = userRole === 'super_admin';
    const isOwnBarber = barber?.userId === userId;

    if (!isSuperAdmin && !isOwnBarber) {
      throw new HttpsError(
        'permission-denied',
        'Not authorized to update this barber'
      );
    }

    // Prepare allowed updates
    const allowedUpdates: any = {
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
          throw new HttpsError(
            'permission-denied',
            `Only super admins can update ${field}`
          );
        }

        allowedUpdates[field] = updates[field];
      }
    }

    await barberDoc.ref.update(allowedUpdates);

    logger.info('Barber updated successfully', {
      barberId,
      updatedBy: userId,
    });

    return {
      success: true,
      message: 'Barber updated successfully',
    };
  } catch (error) {
    logger.error('Error updating barber:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Failed to update barber'
    );
  }
});

/**
 * Delete Barber - Deletes a barber (soft delete by setting isActive=false)
 *
 * Only super_admin can delete barbers
 */
export const deleteBarber = onCall({
  region: config.region,
}, async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  // Check if user is super_admin
  const userRole = request.auth.token.role;
  if (userRole !== 'super_admin') {
    throw new HttpsError(
      'permission-denied',
      'Only super admins can delete barbers'
    );
  }

  const { barberId } = request.data;

  if (!barberId) {
    throw new HttpsError(
      'invalid-argument',
      'barberId is required'
    );
  }

  try {
    const barberDoc = await db.collection('barbers').doc(barberId).get();

    if (!barberDoc.exists) {
      throw new HttpsError(
        'not-found',
        'Barber not found'
      );
    }

    // Soft delete (set isActive to false)
    await barberDoc.ref.update({
      isActive: false,
      isAvailable: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('Barber deleted (soft)', {
      barberId,
      deletedBy: request.auth.uid,
    });

    return {
      success: true,
      message: 'Barber deleted successfully',
    };
  } catch (error) {
    logger.error('Error deleting barber:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Failed to delete barber'
    );
  }
});
