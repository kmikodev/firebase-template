"use strict";
/**
 * Notification Sender - Send FCM notifications to users
 */
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
exports.createNotificationDocument = exports.sendNotificationToTopic = exports.sendNotificationToUser = void 0;
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
const db = admin.firestore();
/**
 * Send notification to a specific user
 */
async function sendNotificationToUser(userId, payload) {
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
        const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
        // Send notification to all user's devices
        const message = {
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
            const invalidTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    invalidTokens.push(tokens[idx]);
                }
            });
            // Delete invalid tokens
            const batch = db.batch();
            for (const token of invalidTokens) {
                const tokenDoc = tokensSnapshot.docs.find(doc => doc.data().token === token);
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
    }
    catch (error) {
        logger.error('Error sending notification', { userId, error });
        throw error;
    }
}
exports.sendNotificationToUser = sendNotificationToUser;
/**
 * Send notification to a topic
 */
async function sendNotificationToTopic(topic, payload) {
    try {
        const message = {
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
    }
    catch (error) {
        logger.error('Error sending topic notification', { topic, error });
        throw error;
    }
}
exports.sendNotificationToTopic = sendNotificationToTopic;
/**
 * Create notification document in Firestore
 */
async function createNotificationDocument(userId, notification) {
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
    }
    catch (error) {
        logger.error('Error creating notification document', { userId, error });
        throw error;
    }
}
exports.createNotificationDocument = createNotificationDocument;
//# sourceMappingURL=sender.js.map