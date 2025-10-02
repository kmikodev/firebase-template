"use strict";
/**
 * Queue Scheduled Functions - Run periodically to check expired timers
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
exports.checkExpiredTimers = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
const config_1 = require("../config");
const db = admin.firestore();
/**
 * Check for expired queue tickets every minute
 *
 * Runs every 1 minute to detect:
 * 1. Clients who didn't arrive within 10 minutes (status = 'waiting')
 * 2. Clients who didn't present within 5 minutes after being called (status = 'notified')
 *
 * Penalties:
 * - No arrival (10 min): -10 points, status → 'expired'
 * - No show (5 min): -15 points, status → 'expired'
 */
exports.checkExpiredTimers = (0, scheduler_1.onSchedule)({
    schedule: 'every 1 minutes',
    region: config_1.config.region,
    timeZone: 'America/Argentina/Buenos_Aires',
}, async () => {
    const now = admin.firestore.Timestamp.now();
    try {
        logger.info('Checking for expired timers...', { timestamp: now.toMillis() });
        // Query tickets with expired timers
        const expiredTicketsSnapshot = await db
            .collection('queues')
            .where('status', 'in', ['waiting', 'notified'])
            .where('timerExpiry', '<=', now)
            .get();
        if (expiredTicketsSnapshot.empty) {
            logger.info('No expired tickets found');
            return;
        }
        logger.info(`Found ${expiredTicketsSnapshot.size} expired tickets`);
        const batch = db.batch();
        const pointsUpdates = [];
        for (const doc of expiredTicketsSnapshot.docs) {
            const ticket = doc.data();
            const queueId = doc.id;
            logger.info(`Processing expired ticket: ${queueId}`, {
                status: ticket.status,
                userId: ticket.userId,
                ticketNumber: ticket.ticketNumber,
            });
            // Determine penalty based on status
            let penalty = 0;
            let reason = '';
            if (ticket.status === 'waiting') {
                // Client didn't arrive within 10 minutes
                penalty = -10;
                reason = 'no_arrival';
                logger.warn(`Client ${ticket.userId} did not arrive - 10 points penalty`, { queueId });
            }
            else if (ticket.status === 'notified') {
                // Client didn't present within 5 minutes after being called
                penalty = -15;
                reason = 'no_show';
                logger.warn(`Client ${ticket.userId} did not show up - 15 points penalty`, { queueId });
            }
            // Update ticket status to expired
            batch.update(doc.ref, {
                status: 'expired',
                expiredAt: admin.firestore.FieldValue.serverTimestamp(),
                timerExpiry: null,
                penaltyApplied: penalty,
                penaltyReason: reason,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Queue points update (will be processed after batch commit)
            pointsUpdates.push({
                userId: ticket.userId,
                points: penalty,
                reason,
                queueId,
            });
            // TODO: Send expiration notification
            // await sendExpirationNotification(ticket.userId, { ticketNumber: ticket.ticketNumber, penalty, reason });
        }
        // Commit batch updates
        await batch.commit();
        logger.info(`Batch updated ${expiredTicketsSnapshot.size} expired tickets`);
        // Update user points (must be done outside batch due to transactions)
        for (const update of pointsUpdates) {
            try {
                await updateUserPoints(update.userId, update.points, update.reason, update.queueId);
            }
            catch (error) {
                logger.error(`Failed to update points for user ${update.userId}`, error);
            }
        }
        // Reorder queue positions for affected branches
        const affectedBranches = new Set(expiredTicketsSnapshot.docs.map(doc => doc.data().branchId));
        for (const branchId of affectedBranches) {
            try {
                await reorderQueuePositions(branchId);
            }
            catch (error) {
                logger.error(`Failed to reorder queue for branch ${branchId}`, error);
            }
        }
        logger.info('checkExpiredTimers completed successfully', {
            expiredCount: expiredTicketsSnapshot.size,
            affectedBranches: affectedBranches.size,
        });
        return;
    }
    catch (error) {
        logger.error('Error in checkExpiredTimers:', error);
        throw error;
    }
});
/**
 * Update user loyalty points (transaction)
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
        logger.info('User points updated in transaction', {
            userId,
            points,
            newPoints,
            reason,
        });
    });
}
/**
 * Reorder queue positions after ticket removal
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
            estimatedWaitTime: (position - 1) * 30,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        position++;
    });
    await batch.commit();
    logger.info('Queue positions reordered for branch', {
        branchId,
        totalTickets: queueSnapshot.size,
    });
}
//# sourceMappingURL=scheduled.js.map