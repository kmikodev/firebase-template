/**
 * Cloud Functions for Firebase - Peluquerías Multitenant App
 *
 * Entry point para todas las Cloud Functions
 */

import * as admin from 'firebase-admin';

// Inicializar Firebase Admin
admin.initializeApp();

// ========================================
// Auth Functions
// ========================================

import { updateUserRole } from './auth/onCreate';

export {
  // Auth
  updateUserRole,
};

// ========================================
// Queue Functions (se agregarán en Milestone 3)
// ========================================

// import { canTakeTicket, takeTicket, markArrival, callTicket, completeTicket, advanceQueue } from './queue';
// import { checkExpiredTickets } from './queue/scheduled';

// export {
//   // Queue management
//   canTakeTicket,
//   takeTicket,
//   markArrival,
//   callTicket,
//   completeTicket,
//   advanceQueue,
//
//   // Scheduled
//   checkExpiredTickets,
// };

// ========================================
// Notifications Functions (se agregarán en Milestone 5)
// ========================================

// import { onQueueCreate, onQueueUpdate } from './notifications/triggers';
// import { sendNotification, sendToTopic } from './notifications/sender';

// export {
//   // Notification triggers
//   onQueueCreate,
//   onQueueUpdate,
//
//   // Notification senders
//   sendNotification,
//   sendToTopic,
// };

// ========================================
// Payments Functions (se agregarán en Milestone 9)
// ========================================

// import { createPaymentIntent, handleStripeWebhook } from './payments';

// export {
//   // Stripe
//   createPaymentIntent,
//   handleStripeWebhook,
// };
