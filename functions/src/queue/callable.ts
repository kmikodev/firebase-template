/**
 * Queue Callable Functions - HTTP callable functions for queue operations
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import { config } from '../config';
import { sendNotificationToUser, createNotificationDocument } from '../notifications/sender';

const db = admin.firestore();

/**
 * Advance queue - Call the next person in line
 *
 * Called by barbers/admins to call the next client
 *
 * @param data.branchId - Branch ID
 * @param data.barberId - Barber ID (optional)
 * @returns Next ticket called or error
 */
export const advanceQueue = onCall({
  region: config.region,
}, async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to advance queue'
    );
  }

  const { branchId, barberId } = request.data;

  // Validate required parameters
  if (!branchId) {
    throw new HttpsError(
      'invalid-argument',
      'branchId is required'
    );
  }

  try {
    logger.info('Advancing queue', {
      branchId,
      barberId,
      userId: request.auth.uid,
    });

    // Get next ticket in queue (status = 'arrived' or 'waiting')
    const nextTicketSnapshot = await db
      .collection('queues')
      .where('branchId', '==', branchId)
      .where('status', 'in', ['arrived', 'waiting'])
      .orderBy('position', 'asc')
      .limit(1)
      .get();

    if (nextTicketSnapshot.empty) {
      logger.info('No tickets in queue', { branchId });
      return {
        success: false,
        message: 'No hay clientes en cola',
      };
    }

    const nextTicketDoc = nextTicketSnapshot.docs[0];
    const nextTicket = nextTicketDoc.data();

    // Update ticket to 'notified' status
    // The onQueueUpdate trigger will handle starting the 5-min timer
    await nextTicketDoc.ref.update({
      status: 'notified',
      barberId: barberId || nextTicket.barberId,
      notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('Queue advanced successfully', {
      queueId: nextTicketDoc.id,
      ticketNumber: nextTicket.ticketNumber,
      userId: nextTicket.userId,
    });

    return {
      success: true,
      ticket: {
        queueId: nextTicketDoc.id,
        ticketNumber: nextTicket.ticketNumber,
        userId: nextTicket.userId,
        position: nextTicket.position,
      },
    };
  } catch (error) {
    logger.error('Error advancing queue:', error);
    throw new HttpsError(
      'internal',
      'Failed to advance queue'
    );
  }
});

/**
 * Take ticket - Client takes a queue ticket
 *
 * Validates:
 * - Queue not full (max 2 tickets ahead)
 * - User not already in queue
 * - User has sufficient points (>= 0)
 *
 * @param data.branchId - Branch ID
 * @param data.serviceId - Service ID (optional)
 * @param data.barberId - Barber ID (optional)
 * @returns New ticket or error
 */
export const takeTicket = onCall({
  region: config.region,
}, async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to take a ticket'
    );
  }

  const { branchId, serviceId, barberId } = request.data;
  const userId = request.auth.uid;

  // Validate required parameters
  if (!branchId) {
    throw new HttpsError(
      'invalid-argument',
      'branchId is required'
    );
  }

  try {
    logger.info('Taking ticket', {
      userId,
      branchId,
      serviceId,
      barberId,
    });

    // Check if user already has an active ticket at this branch
    const existingTicketSnapshot = await db
      .collection('queues')
      .where('userId', '==', userId)
      .where('branchId', '==', branchId)
      .where('status', 'in', ['waiting', 'notified', 'arrived', 'in_service'])
      .get();

    if (!existingTicketSnapshot.empty) {
      throw new HttpsError(
        'already-exists',
        'Ya tienes un turno activo en esta sucursal'
      );
    }

    // Check user points
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError(
        'not-found',
        'User not found'
      );
    }

    const userData = userDoc.data();
    const queuePoints = userData?.queuePoints || 0;

    if (queuePoints < 0) {
      throw new HttpsError(
        'permission-denied',
        `No puedes sacar turno con puntos negativos (${queuePoints}). Completa turnos para recuperar puntos.`
      );
    }

    // Check queue capacity (max 2 tickets ahead)
    const activeTicketsSnapshot = await db
      .collection('queues')
      .where('branchId', '==', branchId)
      .where('status', 'in', ['waiting', 'notified', 'arrived', 'in_service'])
      .orderBy('position', 'asc')
      .get();

    const MAX_ADVANCE_TICKETS = 2;
    const activeCount = activeTicketsSnapshot.size;

    // Find current serving number (lowest position in in_service or first in queue)
    let currentNumber = 1;
    if (!activeTicketsSnapshot.empty) {
      const inServiceTickets = activeTicketsSnapshot.docs.filter(
        doc => doc.data().status === 'in_service'
      );
      if (inServiceTickets.length > 0) {
        currentNumber = inServiceTickets[0].data().position;
      }
    }

    // Next number would be activeCount + 1
    const nextNumber = activeCount + 1;

    if (nextNumber - currentNumber > MAX_ADVANCE_TICKETS) {
      throw new HttpsError(
        'resource-exhausted',
        `Cola llena. Máximo ${MAX_ADVANCE_TICKETS} turnos de anticipación permitidos.`
      );
    }

    // Create new ticket
    const ticketRef = db.collection('queues').doc();
    const ticketData = {
      queueId: ticketRef.id,
      userId,
      branchId,
      serviceId: serviceId || null,
      barberId: barberId || null,
      status: 'waiting',
      position: nextNumber, // Will be recalculated by onQueueCreate trigger
      ticketNumber: null, // Will be generated by onQueueCreate trigger
      timerExpiry: null, // Will be set by onQueueCreate trigger
      estimatedWaitTime: 0, // Will be calculated by onQueueCreate trigger
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await ticketRef.set(ticketData);

    logger.info('Ticket created successfully', {
      queueId: ticketRef.id,
      userId,
      position: nextNumber,
    });

    // The onQueueCreate trigger will handle:
    // - Calculating exact position
    // - Generating ticket number
    // - Starting 10-minute timer
    // - Sending confirmation notification

    return {
      success: true,
      queueId: ticketRef.id,
      position: nextNumber,
      message: 'Turno creado exitosamente',
    };
  } catch (error) {
    logger.error('Error taking ticket:', error);

    // Re-throw HttpsError to preserve status code
    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Failed to create ticket'
    );
  }
});

/**
 * Mark arrival - Client marks arrival at the branch
 *
 * @param data.queueId - Queue ticket ID
 * @returns Updated ticket
 */
export const markArrival = onCall({
  region: config.region,
}, async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { queueId } = request.data;
  const userId = request.auth.uid;

  if (!queueId) {
    throw new HttpsError(
      'invalid-argument',
      'queueId is required'
    );
  }

  try {
    const ticketDoc = await db.collection('queues').doc(queueId).get();

    if (!ticketDoc.exists) {
      throw new HttpsError(
        'not-found',
        'Ticket not found'
      );
    }

    const ticket = ticketDoc.data();

    // Get user's custom claims to check role
    const userRole = request.auth.token.role;
    const isAdmin = userRole === 'super_admin' || userRole === 'admin' || userRole === 'barber';

    // Verify ownership (clients can only mark their own arrival, but admins/barbers can mark anyone's)
    if (ticket?.userId !== userId && !isAdmin) {
      throw new HttpsError(
        'permission-denied',
        'Not authorized to update this ticket'
      );
    }

    // Can only mark arrival if status is 'waiting' or 'notified'
    if (ticket?.status !== 'waiting' && ticket?.status !== 'notified') {
      throw new HttpsError(
        'failed-precondition',
        `Cannot mark arrival from status: ${ticket?.status}`
      );
    }

    // Update to 'arrived' status
    // The onQueueUpdate trigger will handle stopping the timer
    await ticketDoc.ref.update({
      status: 'arrived',
      arrivedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send notification to client confirming arrival
    const clientUserId = ticket?.userId;
    if (clientUserId) {
      try {
        await createNotificationDocument(clientUserId, {
          type: 'arrival_confirmed',
          title: '✅ Llegada Confirmada',
          body: 'Tu llegada ha sido confirmada. Pronto serás atendido.',
          data: { queueId },
        });

        await sendNotificationToUser(clientUserId, {
          title: '✅ Llegada Confirmada',
          body: 'Tu llegada ha sido confirmada. Pronto serás atendido.',
          data: { queueId },
        });

        logger.info('Arrival confirmation notification sent', {
          queueId,
          clientUserId,
        });
      } catch (notifError) {
        logger.error('Error sending arrival confirmation notification', {
          error: notifError,
          queueId,
          clientUserId,
        });
        // Don't fail the entire operation if notification fails
      }
    }

    logger.info('Arrival marked successfully', {
      queueId,
      userId,
    });

    return {
      success: true,
      message: 'Llegada confirmada',
    };
  } catch (error) {
    logger.error('Error marking arrival:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Failed to mark arrival'
    );
  }
});

/**
 * Complete ticket - Mark service as complete
 *
 * Called by barbers/admins when service is finished
 *
 * @param data.queueId - Queue ticket ID
 * @returns Success status
 */
export const completeTicket = onCall({
  region: config.region,
}, async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { queueId } = request.data;
  const userId = request.auth.uid;

  if (!queueId) {
    throw new HttpsError(
      'invalid-argument',
      'queueId is required'
    );
  }

  try {
    const ticketDoc = await db.collection('queues').doc(queueId).get();

    if (!ticketDoc.exists) {
      throw new HttpsError(
        'not-found',
        'Ticket not found'
      );
    }

    const ticket = ticketDoc.data();

    // Get user's custom claims to check role
    const userRole = request.auth.token.role;
    const isAdmin = userRole === 'super_admin' || userRole === 'admin' || userRole === 'barber';

    // Only admins/barbers can complete tickets (clients cannot complete their own service)
    if (!isAdmin) {
      throw new HttpsError(
        'permission-denied',
        'Only barbers and admins can complete services'
      );
    }

    // Can complete from 'in_service' or 'arrived' status
    if (ticket?.status !== 'in_service' && ticket?.status !== 'arrived') {
      throw new HttpsError(
        'failed-precondition',
        `Cannot complete ticket from status: ${ticket?.status}`
      );
    }

    // Update to 'completed' status
    await ticketDoc.ref.update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('Ticket completed successfully', {
      queueId,
      completedBy: userId,
    });

    return {
      success: true,
      message: 'Servicio completado',
    };
  } catch (error) {
    logger.error('Error completing ticket:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Failed to complete ticket'
    );
  }
});

/**
 * Cancel ticket - Cancel a queue ticket
 *
 * Can be called by:
 * - Client (cancel their own ticket)
 * - Barber/Admin (cancel any ticket with reason)
 *
 * @param data.queueId - Queue ticket ID
 * @param data.reason - Cancellation reason (optional)
 * @returns Success status
 */
export const cancelTicket = onCall({
  region: config.region,
}, async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { queueId, reason } = request.data;
  const userId = request.auth.uid;

  if (!queueId) {
    throw new HttpsError(
      'invalid-argument',
      'queueId is required'
    );
  }

  try {
    const ticketDoc = await db.collection('queues').doc(queueId).get();

    if (!ticketDoc.exists) {
      throw new HttpsError(
        'not-found',
        'Ticket not found'
      );
    }

    const ticket = ticketDoc.data();

    // Verify ownership or admin rights
    // For now, allow ticket owner or any authenticated user (for testing)
    // TODO: Add proper role check for admin/barber
    const isOwner = ticket?.userId === userId;

    if (!isOwner) {
      // TODO: Check if user is admin/barber
      logger.info('Non-owner cancelling ticket', {
        queueId,
        cancelledBy: userId,
        owner: ticket?.userId,
      });
    }

    // Can only cancel active tickets
    const cancelableStatuses = ['waiting', 'notified', 'arrived', 'in_service'];
    if (!cancelableStatuses.includes(ticket?.status)) {
      throw new HttpsError(
        'failed-precondition',
        `Cannot cancel ticket with status: ${ticket?.status}`
      );
    }

    // Update to 'cancelled' status
    await ticketDoc.ref.update({
      status: 'cancelled',
      cancelReason: reason || (isOwner ? 'Cancelado por el cliente' : 'Cancelado por admin'),
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('Ticket cancelled successfully', {
      queueId,
      cancelledBy: userId,
      reason,
    });

    return {
      success: true,
      message: 'Turno cancelado',
    };
  } catch (error) {
    logger.error('Error cancelling ticket:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Failed to cancel ticket'
    );
  }
});
