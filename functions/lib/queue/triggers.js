"use strict";
/**
 * Queue Triggers - Firestore triggers for queue operations
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
exports.onQueueUpdate = exports.onQueueCreate = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
const config_1 = require("../config");
const sender_1 = require("../notifications/sender");
const db = admin.firestore();
/**
 * Trigger when a new queue ticket is created
 *
 * Actions:
 * 1. Calculate position in queue
 * 2. Generate ticket number
 * 3. Start 10-minute arrival timer
 * 4. Send confirmation notification
 */
exports.onQueueCreate = (0, firestore_1.onDocumentCreated)({
    document: 'queues/{queueId}',
    region: config_1.config.region,
}, async (event) => {
    var _a, _b;
    const queueId = event.params.queueId;
    const ticket = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!ticket) {
        logger.error('No ticket data in event');
        return;
    }
    try {
        logger.info(`Queue ticket created: ${queueId}`, { ticket });
        // Calculate position in queue
        const queueSnapshot = await db
            .collection('queues')
            .where('branchId', '==', ticket.branchId)
            .where('status', 'in', ['waiting', 'notified', 'arrived', 'in_service'])
            .orderBy('position', 'asc')
            .get();
        const position = queueSnapshot.size;
        // Generate ticket number (BRANCH_CODE-YYYYMMDD-###)
        const branch = await db.collection('branches').doc(ticket.branchId).get();
        const branchData = branch.data();
        const branchCode = (branchData === null || branchData === void 0 ? void 0 : branchData.name.substring(0, 4).toUpperCase()) || 'UNKN';
        const date = new Date();
        const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const ticketNumber = `${branchCode}-${dateStr}-${String(position).padStart(3, '0')}`;
        // Calculate timer expiry (10 minutes from now)
        const timerExpiry = admin.firestore.Timestamp.fromMillis(Date.now() + 10 * 60 * 1000 // 10 minutes
        );
        // Calculate estimated wait time (30 min per person ahead)
        const estimatedWaitMinutes = position * 30;
        // Update ticket with calculated values
        await ((_b = event.data) === null || _b === void 0 ? void 0 : _b.ref.update({
            position,
            ticketNumber,
            timerExpiry,
            estimatedWaitTime: estimatedWaitMinutes,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }));
        logger.info(`Queue ticket updated with position ${position}`, {
            queueId,
            ticketNumber,
            position,
        });
        // Send confirmation notification
        try {
            await (0, sender_1.sendNotificationToUser)(ticket.userId, {
                title: '🎫 Turno Confirmado',
                body: `Tu turno es #${ticketNumber}. Posición ${position} en la cola. Tiempo estimado: ${estimatedWaitMinutes} min.`,
                data: {
                    type: 'ticket_confirmed',
                    queueId,
                    ticketNumber,
                    position: String(position),
                },
            });
            await (0, sender_1.createNotificationDocument)(ticket.userId, {
                type: 'ticket_confirmed',
                title: 'Turno Confirmado',
                body: `Turno #${ticketNumber} - Posición ${position}`,
                data: { queueId, ticketNumber, position },
            });
        }
        catch (notifError) {
            logger.error('Error sending confirmation notification', notifError);
            // Don't fail the whole function if notification fails
        }
        return { success: true, position, ticketNumber };
    }
    catch (error) {
        logger.error('Error in onQueueCreate:', error);
        throw error;
    }
});
/**
 * Trigger when a queue ticket is updated
 *
 * Handles status transitions:
 * - waiting → arrived: Stop arrival timer, client marked arrival
 * - waiting → notified: Start 5-minute grace timer, called by barber
 * - notified → in_service: Stop grace timer, client presented
 * - in_service → completed: Award +1 point, mark as done
 * - any → cancelled: Clean up, apply penalties if applicable
 */
exports.onQueueUpdate = (0, firestore_1.onDocumentUpdated)({
    document: 'queues/{queueId}',
    region: config_1.config.region,
}, async (event) => {
    var _a, _b, _c;
    const queueId = event.params.queueId;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after) {
        logger.error('Missing data in event');
        return;
    }
    // Only process if status changed
    if (before.status === after.status) {
        return null;
    }
    try {
        logger.info(`Queue status changed: ${before.status} → ${after.status}`, {
            queueId,
            userId: after.userId,
        });
        const updates = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        switch (after.status) {
            case 'arrived':
                // Client marked arrival - stop arrival timer
                updates.timerExpiry = null;
                updates.arrivedAt = admin.firestore.FieldValue.serverTimestamp();
                logger.info('Client arrived, timer stopped', { queueId });
                break;
            case 'notified':
                // Barber called client - start 5-minute grace timer
                updates.timerExpiry = admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000 // 5 minutes
                );
                updates.notifiedAt = admin.firestore.FieldValue.serverTimestamp();
                logger.info('Client notified, grace timer started', { queueId });
                // Send "Your turn!" notification
                try {
                    await (0, sender_1.sendNotificationToUser)(after.userId, {
                        title: '🎉 ¡ES TU TURNO!',
                        body: `Turno #${after.ticketNumber}. Preséntate en el mostrador ahora. Tienes 5 minutos.`,
                        data: {
                            type: 'your_turn',
                            queueId,
                            ticketNumber: after.ticketNumber,
                        },
                    });
                    await (0, sender_1.createNotificationDocument)(after.userId, {
                        type: 'your_turn',
                        title: '¡ES TU TURNO!',
                        body: `Turno #${after.ticketNumber} - Preséntate ahora`,
                        data: { queueId, ticketNumber: after.ticketNumber },
                    });
                }
                catch (notifError) {
                    logger.error('Error sending your turn notification', notifError);
                }
                break;
            case 'in_service':
                // Client presented - stop grace timer, start service
                updates.timerExpiry = null;
                updates.serviceStartedAt = admin.firestore.FieldValue.serverTimestamp();
                logger.info('Service started, timer stopped', { queueId });
                break;
            case 'completed':
                // Service completed - award points
                updates.completedAt = admin.firestore.FieldValue.serverTimestamp();
                // Award +1 point for completing service
                await updateUserPoints(after.userId, 1, 'completed_service', queueId);
                logger.info('Service completed, +1 point awarded', { queueId, userId: after.userId });
                // Reorder queue positions
                await reorderQueuePositions(after.branchId);
                break;
            case 'cancelled':
                // Ticket cancelled
                updates.cancelledAt = admin.firestore.FieldValue.serverTimestamp();
                updates.timerExpiry = null;
                // Apply penalty if cancelled late (less than 1 hour before)
                if (after.cancelReason === 'late_cancellation') {
                    await updateUserPoints(after.userId, -5, 'late_cancellation', queueId);
                    logger.info('Late cancellation, -5 points applied', { queueId, userId: after.userId });
                }
                // Reorder queue positions
                await reorderQueuePositions(after.branchId);
                break;
            case 'expired':
                // Ticket expired - penalty applied by scheduled function
                updates.expiredAt = admin.firestore.FieldValue.serverTimestamp();
                updates.timerExpiry = null;
                // Reorder queue positions
                await reorderQueuePositions(after.branchId);
                break;
        }
        // Apply updates
        if (Object.keys(updates).length > 1) {
            await ((_c = event.data) === null || _c === void 0 ? void 0 : _c.after.ref.update(updates));
        }
        return { success: true, status: after.status };
    }
    catch (error) {
        logger.error('Error in onQueueUpdate:', error);
        throw error;
    }
});
/**
 * Update user loyalty points
 *
 * @param userId - User ID
 * @param points - Points to add/subtract (negative for penalties)
 * @param reason - Reason for point change
 * @param queueId - Related queue ticket ID
 */
async function updateUserPoints(userId, points, reason, queueId) {
    const userRef = db.collection('users').doc(userId);
    const transactionRef = db.collection('loyaltyTransactions').doc();
    await db.runTransaction(async (transaction) => {
        var _a;
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
            throw new Error(`User ${userId} not found`);
        }
        const currentPoints = ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.queuePoints) || 0;
        const newPoints = currentPoints + points;
        // Update user points
        transaction.update(userRef, {
            queuePoints: newPoints,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Create transaction record
        transaction.set(transactionRef, {
            transactionId: transactionRef.id,
            userId,
            points,
            reason,
            queueId,
            balanceBefore: currentPoints,
            balanceAfter: newPoints,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info('User points updated', {
            userId,
            points,
            currentPoints,
            newPoints,
            reason,
        });
    });
}
/**
 * Reorder queue positions after ticket removal
 *
 * @param branchId - Branch ID
 */
async function reorderQueuePositions(branchId) {
    const queueSnapshot = await db
        .collection('queues')
        .where('branchId', '==', branchId)
        .where('status', 'in', ['waiting', 'notified', 'arrived', 'in_service'])
        .orderBy('position', 'asc')
        .get();
    const batch = db.batch();
    let position = 1;
    queueSnapshot.forEach((doc) => {
        batch.update(doc.ref, {
            position,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        position++;
    });
    await batch.commit();
    logger.info('Queue positions reordered', {
        branchId,
        totalTickets: queueSnapshot.size,
    });
}
//# sourceMappingURL=triggers.js.map