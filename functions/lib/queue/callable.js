"use strict";
/**
 * Queue Callable Functions - HTTP callable functions for queue operations
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
exports.cancelTicket = exports.completeTicket = exports.markArrival = exports.takeTicket = exports.advanceQueue = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
const config_1 = require("../config");
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
exports.advanceQueue = (0, https_1.onCall)({
    region: config_1.config.region,
}, async (request) => {
    // Check authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated to advance queue');
    }
    const { branchId, barberId } = request.data;
    // Validate required parameters
    if (!branchId) {
        throw new https_1.HttpsError('invalid-argument', 'branchId is required');
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
    }
    catch (error) {
        logger.error('Error advancing queue:', error);
        throw new https_1.HttpsError('internal', 'Failed to advance queue');
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
exports.takeTicket = (0, https_1.onCall)({
    region: config_1.config.region,
}, async (request) => {
    // Check authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated to take a ticket');
    }
    const { branchId, serviceId, barberId } = request.data;
    const userId = request.auth.uid;
    // Validate required parameters
    if (!branchId) {
        throw new https_1.HttpsError('invalid-argument', 'branchId is required');
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
            throw new https_1.HttpsError('already-exists', 'Ya tienes un turno activo en esta sucursal');
        }
        // Check user points
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new https_1.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        const queuePoints = (userData === null || userData === void 0 ? void 0 : userData.queuePoints) || 0;
        if (queuePoints < 0) {
            throw new https_1.HttpsError('permission-denied', `No puedes sacar turno con puntos negativos (${queuePoints}). Completa turnos para recuperar puntos.`);
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
            const inServiceTickets = activeTicketsSnapshot.docs.filter(doc => doc.data().status === 'in_service');
            if (inServiceTickets.length > 0) {
                currentNumber = inServiceTickets[0].data().position;
            }
        }
        // Next number would be activeCount + 1
        const nextNumber = activeCount + 1;
        if (nextNumber - currentNumber > MAX_ADVANCE_TICKETS) {
            throw new https_1.HttpsError('resource-exhausted', `Cola llena. Máximo ${MAX_ADVANCE_TICKETS} turnos de anticipación permitidos.`);
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
            position: nextNumber,
            ticketNumber: null,
            timerExpiry: null,
            estimatedWaitTime: 0,
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
    }
    catch (error) {
        logger.error('Error taking ticket:', error);
        // Re-throw HttpsError to preserve status code
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to create ticket');
    }
});
/**
 * Mark arrival - Client marks arrival at the branch
 *
 * @param data.queueId - Queue ticket ID
 * @returns Updated ticket
 */
exports.markArrival = (0, https_1.onCall)({
    region: config_1.config.region,
}, async (request) => {
    // Check authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { queueId } = request.data;
    const userId = request.auth.uid;
    if (!queueId) {
        throw new https_1.HttpsError('invalid-argument', 'queueId is required');
    }
    try {
        const ticketDoc = await db.collection('queues').doc(queueId).get();
        if (!ticketDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Ticket not found');
        }
        const ticket = ticketDoc.data();
        // Verify ownership
        if ((ticket === null || ticket === void 0 ? void 0 : ticket.userId) !== userId) {
            throw new https_1.HttpsError('permission-denied', 'Not authorized to update this ticket');
        }
        // Can only mark arrival if status is 'waiting'
        if ((ticket === null || ticket === void 0 ? void 0 : ticket.status) !== 'waiting') {
            throw new https_1.HttpsError('failed-precondition', `Cannot mark arrival from status: ${ticket === null || ticket === void 0 ? void 0 : ticket.status}`);
        }
        // Update to 'arrived' status
        // The onQueueUpdate trigger will handle stopping the timer
        await ticketDoc.ref.update({
            status: 'arrived',
            arrivedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info('Arrival marked successfully', {
            queueId,
            userId,
        });
        return {
            success: true,
            message: 'Llegada confirmada',
        };
    }
    catch (error) {
        logger.error('Error marking arrival:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to mark arrival');
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
exports.completeTicket = (0, https_1.onCall)({
    region: config_1.config.region,
}, async (request) => {
    // Check authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { queueId } = request.data;
    const userId = request.auth.uid;
    if (!queueId) {
        throw new https_1.HttpsError('invalid-argument', 'queueId is required');
    }
    try {
        const ticketDoc = await db.collection('queues').doc(queueId).get();
        if (!ticketDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Ticket not found');
        }
        const ticket = ticketDoc.data();
        // Check if user is barber/admin (has role permission)
        // For now, allow ticket owner or any authenticated user (for testing)
        // TODO: Add proper role check
        // Can complete from 'in_service' or 'arrived' status
        if ((ticket === null || ticket === void 0 ? void 0 : ticket.status) !== 'in_service' && (ticket === null || ticket === void 0 ? void 0 : ticket.status) !== 'arrived') {
            throw new https_1.HttpsError('failed-precondition', `Cannot complete ticket from status: ${ticket === null || ticket === void 0 ? void 0 : ticket.status}`);
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
    }
    catch (error) {
        logger.error('Error completing ticket:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to complete ticket');
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
exports.cancelTicket = (0, https_1.onCall)({
    region: config_1.config.region,
}, async (request) => {
    // Check authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { queueId, reason } = request.data;
    const userId = request.auth.uid;
    if (!queueId) {
        throw new https_1.HttpsError('invalid-argument', 'queueId is required');
    }
    try {
        const ticketDoc = await db.collection('queues').doc(queueId).get();
        if (!ticketDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Ticket not found');
        }
        const ticket = ticketDoc.data();
        // Verify ownership or admin rights
        // For now, allow ticket owner or any authenticated user (for testing)
        // TODO: Add proper role check for admin/barber
        const isOwner = (ticket === null || ticket === void 0 ? void 0 : ticket.userId) === userId;
        if (!isOwner) {
            // TODO: Check if user is admin/barber
            logger.info('Non-owner cancelling ticket', {
                queueId,
                cancelledBy: userId,
                owner: ticket === null || ticket === void 0 ? void 0 : ticket.userId,
            });
        }
        // Can only cancel active tickets
        const cancelableStatuses = ['waiting', 'notified', 'arrived', 'in_service'];
        if (!cancelableStatuses.includes(ticket === null || ticket === void 0 ? void 0 : ticket.status)) {
            throw new https_1.HttpsError('failed-precondition', `Cannot cancel ticket with status: ${ticket === null || ticket === void 0 ? void 0 : ticket.status}`);
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
    }
    catch (error) {
        logger.error('Error cancelling ticket:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to cancel ticket');
    }
});
//# sourceMappingURL=callable.js.map