/**
 * Configuration for Cloud Functions
 */

export const config = {
  // Region for Cloud Functions
  region: 'europe-west1', // España (Madrid)

  // Queue settings
  queue: {
    maxAdvanceTickets: 2, // Máximo 1-2 turnos antes
    arrivalTimerMinutes: 10, // Timer para llegar al local
    graceTimerMinutes: 5, // Timer de gracia al ser llamado
    defaultServiceTimeMinutes: 15, // Tiempo promedio por servicio
  },

  // Penalty points
  penalties: {
    noArrival: -10, // No llegar en 10 min
    noShow: -15, // No presentarse tras ser llamado
    cancelledLate: -5, // Cancelar < 1h antes
    completed: 1, // Completar turno
  },

  // Notification settings
  notifications: {
    priorities: {
      critical: 'high',
      normal: 'normal',
    },
    ttl: {
      yourTurn: 300, // 5 minutos
      positionUpdate: 180, // 3 minutos
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
    role: 'client' as const,
  },
};
