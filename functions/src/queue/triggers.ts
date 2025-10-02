/**
 * Queue Triggers - Firestore triggers for queue operations
 */

import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import { config } from '../config';

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
export const onQueueCreate = onDocumentCreated({
  document: 'queues/{queueId}',
  region: config.region,
}, async (event) => {
    const queueId = event.params.queueId;
    const ticket = event.data?.data();

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
      const branchCode = branchData?.name.substring(0, 4).toUpperCase() || 'UNKN';
      const date = new Date();
      const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
      const ticketNumber = `${branchCode}-${dateStr}-${String(position).padStart(3, '0')}`;

      // Calculate timer expiry (10 minutes from now)
      const timerExpiry = admin.firestore.Timestamp.fromMillis(
        Date.now() + 10 * 60 * 1000 // 10 minutes
      );

      // Calculate estimated wait time (30 min per person ahead)
      const estimatedWaitMinutes = position * 30;

      // Update ticket with calculated values
      await event.data?.ref.update({
        position,
        ticketNumber,
        timerExpiry,
        estimatedWaitTime: estimatedWaitMinutes,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Queue ticket updated with position ${position}`, {
        queueId,
        ticketNumber,
        position,
      });

      // TODO: Send confirmation notification
      // await sendQueueConfirmation(ticket.userId, { ticketNumber, position, estimatedWaitMinutes });

      return { success: true, position, ticketNumber };
    } catch (error) {
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
export const onQueueUpdate = onDocumentUpdated({
  document: 'queues/{queueId}',
  region: config.region,
}, async (event) => {
    const queueId = event.params.queueId;
    const before = event.data?.before.data();
    const after = event.data?.after.data();

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

      const updates: any = {
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
          updates.timerExpiry = admin.firestore.Timestamp.fromMillis(
            Date.now() + 5 * 60 * 1000 // 5 minutes
          );
          updates.notifiedAt = admin.firestore.FieldValue.serverTimestamp();
          logger.info('Client notified, grace timer started', { queueId });

          // TODO: Send "Your turn!" notification
          // await sendYourTurnNotification(after.userId, { queueId, ticketNumber: after.ticketNumber });
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
        await event.data?.after.ref.update(updates);
      }

      return { success: true, status: after.status };
    } catch (error) {
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
async function updateUserPoints(
  userId: string,
  points: number,
  reason: string,
  queueId: string
): Promise<void> {
  const userRef = db.collection('users').doc(userId);
  const transactionRef = db.collection('loyaltyTransactions').doc();

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
      throw new Error(`User ${userId} not found`);
    }

    const currentPoints = userDoc.data()?.queuePoints || 0;
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
async function reorderQueuePositions(branchId: string): Promise<void> {
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
