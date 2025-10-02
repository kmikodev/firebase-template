/**
 * Notification Sender - Send FCM notifications to users
 */

import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

const db = admin.firestore();

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

/**
 * Send notification to a specific user
 */
export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload
): Promise<void> {
  try {
    // Get user's FCM tokens
    const tokensSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .get();

    if (tokensSnapshot.empty) {
      logger.info('No FCM tokens found for user', { userId });
      return;
    }

    const tokens = tokensSnapshot.docs.map(doc => doc.data().token as string);

    // Send notification to all user's devices
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data || {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'queue_updates',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    logger.info('Notification sent', {
      userId,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    // Remove invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          invalidTokens.push(tokens[idx]);
        }
      });

      // Delete invalid tokens
      const batch = db.batch();
      for (const token of invalidTokens) {
        const tokenDoc = tokensSnapshot.docs.find(
          doc => doc.data().token === token
        );
        if (tokenDoc) {
          batch.delete(tokenDoc.ref);
        }
      }
      await batch.commit();

      logger.info('Removed invalid tokens', {
        userId,
        count: invalidTokens.length,
      });
    }
  } catch (error) {
    logger.error('Error sending notification', { userId, error });
    throw error;
  }
}

/**
 * Send notification to a topic
 */
export async function sendNotificationToTopic(
  topic: string,
  payload: NotificationPayload
): Promise<void> {
  try {
    const message: admin.messaging.Message = {
      topic,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data || {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'queue_updates',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const messageId = await admin.messaging().send(message);

    logger.info('Topic notification sent', {
      topic,
      messageId,
    });
  } catch (error) {
    logger.error('Error sending topic notification', { topic, error });
    throw error;
  }
}

/**
 * Create notification document in Firestore
 */
export async function createNotificationDocument(
  userId: string,
  notification: {
    type: string;
    title: string;
    body: string;
    data?: Record<string, any>;
  }
): Promise<void> {
  try {
    await db.collection('notifications').add({
      userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('Notification document created', {
      userId,
      type: notification.type,
    });
  } catch (error) {
    logger.error('Error creating notification document', { userId, error });
    throw error;
  }
}
