"use strict";
/**
 * Configuration for Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    // Region for Cloud Functions
    region: 'europe-west1',
    // Queue settings
    queue: {
        maxAdvanceTickets: 2,
        arrivalTimerMinutes: 10,
        graceTimerMinutes: 5,
        defaultServiceTimeMinutes: 15, // Tiempo promedio por servicio
    },
    // Penalty points
    penalties: {
        noArrival: -10,
        noShow: -15,
        cancelledLate: -5,
        completed: 1, // Completar turno
    },
    // Notification settings
    notifications: {
        priorities: {
            critical: 'high',
            normal: 'normal',
        },
        ttl: {
            yourTurn: 300,
            positionUpdate: 180,
            reminder: 7200, // 2 horas
        },
    },
    // Spain/EUR settings
    locale: {
        country: 'ES',
        currency: 'EUR',
        language: 'es',
        timezone: 'Europe/Madrid',
    },
    // Default user settings
    defaultUser: {
        queuePoints: 100,
        role: 'client',
    },
};
//# sourceMappingURL=index.js.map