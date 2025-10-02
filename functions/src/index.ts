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
import { setSuperAdmin, setSuperAdminHTTP } from './auth/setSuperAdmin';

export {
  // Auth
  updateUserRole,
  setSuperAdmin,
  setSuperAdminHTTP,
};

// ========================================
// Queue Functions
// ========================================

import { onQueueCreate, onQueueUpdate } from './queue/triggers';
import { checkExpiredTimers } from './queue/scheduled';
import { advanceQueue, takeTicket, markArrival, completeTicket, cancelTicket } from './queue/callable';

export {
  // Queue triggers
  onQueueCreate,
  onQueueUpdate,

  // Queue callable functions
  advanceQueue,
  takeTicket,
  markArrival,
  completeTicket,
  cancelTicket,

  // Scheduled
  checkExpiredTimers,
};

// ========================================
// Barber Management Functions
// ========================================

import { createBarber, updateBarber, deleteBarber } from './barbers/callable';

export {
  // Barbers
  createBarber,
  updateBarber,
  deleteBarber,
};

// ========================================
// Loyalty Card System Functions
// ========================================

import {
  onQueueCompleted,
  redeemReward,
  applyRewardToQueue,
  expireStampsDaily,
  expireRewardsDaily,
} from './loyalty';

export {
  // Loyalty triggers
  onQueueCompleted,

  // Loyalty callable
  redeemReward,
  applyRewardToQueue,

  // Loyalty scheduled
  expireStampsDaily,
  expireRewardsDaily,
};

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
