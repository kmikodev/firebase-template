"use strict";
/**
 * Cloud Functions for Firebase - Peluquerías Multitenant App
 *
 * Entry point para todas las Cloud Functions
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
exports.updateUserRole = void 0;
const admin = __importStar(require("firebase-admin"));
// Inicializar Firebase Admin
admin.initializeApp();
// ========================================
// Auth Functions
// ========================================
const onCreate_1 = require("./auth/onCreate");
Object.defineProperty(exports, "updateUserRole", { enumerable: true, get: function () { return onCreate_1.updateUserRole; } });
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
//# sourceMappingURL=index.js.map