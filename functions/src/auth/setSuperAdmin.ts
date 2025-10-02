/**
 * Cloud Function to set super_admin custom claims
 *
 * This is a one-time setup function to establish the first super admin.
 * Can be called via HTTP or Firebase Console.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

/**
 * HTTP Callable function to set a user as super_admin
 *
 * Usage:
 * 1. Call this function with email: c2developers2025@gmail.com
 * 2. User will be granted super_admin role
 * 3. User document will be created/updated in Firestore
 */
export const setSuperAdmin = onCall(async (request) => {
  // Security: Only allow authenticated requests
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to call this function'
    );
  }

  const { email } = request.data;

  if (!email) {
    throw new HttpsError(
      'invalid-argument',
      'Email is required'
    );
  }

  try {
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);

    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'super_admin',
      isAnonymous: false,
    });

    // Create/update user document in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      userId: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || email.split('@')[0],
      photoURL: userRecord.photoURL || null,
      role: 'super_admin',
      isAnonymous: false,
      queuePoints: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    logger.info(`Super admin set for user: ${email}`);

    return {
      success: true,
      message: `Super admin role set for ${email}`,
      uid: userRecord.uid,
    };
  } catch (error: any) {
    logger.error('Error setting super admin:', error);
    throw new HttpsError(
      'internal',
      `Failed to set super admin: ${error.message}`
    );
  }
});

/**
 * Alternative: HTTP endpoint version (can be called via URL)
 *
 * Usage: POST https://us-central1-PROJECT_ID.cloudfunctions.net/setSuperAdminHTTP
 * Body: { "email": "c2developers2025@gmail.com", "secret": "YOUR_SECRET_KEY" }
 */
export const setSuperAdminHTTP = onRequest(async (req, res) => {
  // CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { email, secret } = req.body;

  // Basic security: require a secret key
  // In production, you should use Firebase Authentication or more robust security
  const ADMIN_SECRET = process.env.ADMIN_SECRET || 'change-this-secret-key';

  if (secret !== ADMIN_SECRET) {
    res.status(403).json({ error: 'Invalid secret key' });
    return;
  }

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);

    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'super_admin',
      isAnonymous: false,
    });

    // Create/update user document in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      userId: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || email.split('@')[0],
      photoURL: userRecord.photoURL || null,
      role: 'super_admin',
      isAnonymous: false,
      queuePoints: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    logger.info(`Super admin set via HTTP for user: ${email}`);

    res.status(200).json({
      success: true,
      message: `Super admin role set for ${email}`,
      uid: userRecord.uid,
    });
  } catch (error: any) {
    logger.error('Error setting super admin via HTTP:', error);
    res.status(500).json({
      error: 'Failed to set super admin',
      details: error.message,
    });
  }
});
