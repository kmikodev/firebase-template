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
exports.deleteBarber = exports.updateBarber = exports.createBarber = exports.checkExpiredTimers = exports.cancelTicket = exports.completeTicket = exports.markArrival = exports.takeTicket = exports.advanceQueue = exports.onQueueUpdate = exports.onQueueCreate = exports.setSuperAdminHTTP = exports.setSuperAdmin = exports.updateUserRole = void 0;
const admin = __importStar(require("firebase-admin"));
// Inicializar Firebase Admin
admin.initializeApp();
// ========================================
// Auth Functions
// ========================================
const onCreate_1 = require("./auth/onCreate");
Object.defineProperty(exports, "updateUserRole", { enumerable: true, get: function () { return onCreate_1.updateUserRole; } });
const setSuperAdmin_1 = require("./auth/setSuperAdmin");
Object.defineProperty(exports, "setSuperAdmin", { enumerable: true, get: function () { return setSuperAdmin_1.setSuperAdmin; } });
Object.defineProperty(exports, "setSuperAdminHTTP", { enumerable: true, get: function () { return setSuperAdmin_1.setSuperAdminHTTP; } });
// ========================================
// Queue Functions
// ========================================
const triggers_1 = require("./queue/triggers");
Object.defineProperty(exports, "onQueueCreate", { enumerable: true, get: function () { return triggers_1.onQueueCreate; } });
Object.defineProperty(exports, "onQueueUpdate", { enumerable: true, get: function () { return triggers_1.onQueueUpdate; } });
const scheduled_1 = require("./queue/scheduled");
Object.defineProperty(exports, "checkExpiredTimers", { enumerable: true, get: function () { return scheduled_1.checkExpiredTimers; } });
const callable_1 = require("./queue/callable");
Object.defineProperty(exports, "advanceQueue", { enumerable: true, get: function () { return callable_1.advanceQueue; } });
Object.defineProperty(exports, "takeTicket", { enumerable: true, get: function () { return callable_1.takeTicket; } });
Object.defineProperty(exports, "markArrival", { enumerable: true, get: function () { return callable_1.markArrival; } });
Object.defineProperty(exports, "completeTicket", { enumerable: true, get: function () { return callable_1.completeTicket; } });
Object.defineProperty(exports, "cancelTicket", { enumerable: true, get: function () { return callable_1.cancelTicket; } });
// ========================================
// Barber Management Functions
// ========================================
const callable_2 = require("./barbers/callable");
Object.defineProperty(exports, "createBarber", { enumerable: true, get: function () { return callable_2.createBarber; } });
Object.defineProperty(exports, "updateBarber", { enumerable: true, get: function () { return callable_2.updateBarber; } });
Object.defineProperty(exports, "deleteBarber", { enumerable: true, get: function () { return callable_2.deleteBarber; } });
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