import { Timestamp } from 'firebase-admin/firestore';

// ========================================
// User Types
// ========================================

export type UserRole = 'super_admin' | 'franchise_owner' | 'admin' | 'barber' | 'client' | 'guest';

export interface User {
  id: string;
  email: string | null;
  displayName: string;
  photoURL: string | null;
  phoneNumber: string | null;
  role: UserRole;
  isAnonymous: boolean;

  // Solo si role != 'client' o 'guest'
  franchiseId?: string;
  branchId?: string;

  // Loyalty points (global)
  queuePoints: number;
  queueHistory: {
    totalCompleted: number;
    totalNoShows: number;
    totalExpired: number;
    totalCancelled: number;
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CustomClaims {
  role: UserRole;
  isAnonymous: boolean;
  franchiseId?: string;
  branchId?: string;
}

// ========================================
// Franchise Types
// ========================================

export interface Franchise {
  franchiseId: string;
  name: string;
  ownerId: string;
  country: string;
  language: string;
  timezone: string;
  currency: string;

  settings: {
    queueEnabled: boolean;
    appointmentsEnabled: boolean;
    loyaltyEnabled: boolean;
    loyaltyRate: number;
  };

  branding: {
    logoURL?: string;
    primaryColor: string;
    secondaryColor: string;
  };

  subscription: {
    plan: 'trial' | 'basic' | 'pro' | 'enterprise';
    status: 'active' | 'suspended';
    expiresAt: Timestamp;
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ========================================
// Branch Types
// ========================================

export interface Branch {
  branchId: string;
  franchiseId: string;
  name: string;
  address: string;
  geolocation: {
    latitude: number;
    longitude: number;
  };
  phone: string;

  hours: {
    monday: { open: string; close: string } | null;
    tuesday: { open: string; close: string } | null;
    wednesday: { open: string; close: string } | null;
    thursday: { open: string; close: string } | null;
    friday: { open: string; close: string } | null;
    saturday: { open: string; close: string } | null;
    sunday: { open: string; close: string } | null;
  };

  capacity: {
    barbers: number;
    queueMax: number;
  };

  status: 'active' | 'inactive';

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ========================================
// Barber Types
// ========================================

export interface Barber {
  barberId: string;
  franchiseId: string;
  branchId: string;
  userId: string;

  schedule: {
    monday?: { start: string; end: string; break?: { start: string; end: string } };
    tuesday?: { start: string; end: string; break?: { start: string; end: string } };
    wednesday?: { start: string; end: string; break?: { start: string; end: string } };
    thursday?: { start: string; end: string; break?: { start: string; end: string } };
    friday?: { start: string; end: string; break?: { start: string; end: string } };
    saturday?: { start: string; end: string; break?: { start: string; end: string } };
    sunday?: { start: string; end: string; break?: { start: string; end: string } };
  };

  specialties: string[];
  status: 'active' | 'on_break' | 'off_duty';

  stats: {
    totalServices: number;
    avgServiceTime: number;
    rating: number;
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ========================================
// Service Types
// ========================================

export interface Service {
  serviceId: string;
  franchiseId: string;
  branchId?: string;

  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;

  category: 'corte' | 'barba' | 'color' | 'combo' | 'otro';
  imageURL?: string;

  status: 'active' | 'inactive';

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ========================================
// Queue Types (FIFO)
// ========================================

export type QueueStatus = 'waiting' | 'notified' | 'arrived' | 'in_service' | 'completed' | 'cancelled' | 'expired';

export interface QueueTicket {
  queueId: string;
  franchiseId: string;
  branchId: string;
  userId: string;

  position: number;
  status: QueueStatus;

  createdAt: Timestamp;
  notifiedAt?: Timestamp;
  timerExpiry?: Timestamp;
  arrivedAt?: Timestamp;
  serviceStartedAt?: Timestamp;
  serviceCompletedAt?: Timestamp;

  barberId?: string;
  serviceId?: string;
  estimatedWaitTime: number;

  updatedAt: Timestamp;
}

// ========================================
// Notification Types
// ========================================

export type NotificationType =
  | 'ticket_confirmed'
  | 'position_update'
  | 'your_turn'
  | 'ticket_expired'
  | 'appointment_reminder'
  | 'new_client'
  | 'client_arrived'
  | 'shift_reminder'
  | 'daily_report'
  | 'alert_no_barbers'
  | 'alert_queue_saturated';

export interface Notification {
  notificationId: string;
  userId: string;
  type: NotificationType;

  title: string;
  body: string;

  data: Record<string, string>;

  sentAt: Timestamp;
  readAt?: Timestamp;

  deliveryStatus: 'sent' | 'failed';
  fcmResponse?: any;
}

// ========================================
// Penalty Types
// ========================================

export type PenaltyType = 'completed' | 'no_arrival' | 'no_show' | 'cancelled_late';

export interface QueuePenalty {
  penaltyId: string;
  userId: string;
  type: PenaltyType;
  points: number;
  ticketId: string;
  reason: string;
  createdAt: Timestamp;
}

// ========================================
// Loyalty Card System Types (Fidelización con Sellos)
// ========================================

export type StampStatus = 'active' | 'expired' | 'used_in_reward';

export interface LoyaltyStamp {
  stampId: string;
  userId: string;
  franchiseId: string;
  branchId: string;

  // Metadata de obtención
  earnedAt: Timestamp;
  expiresAt: Timestamp | null;
  status: StampStatus;

  // Relación con servicio
  queueId: string;
  serviceId: string;
  barberId: string;

  // Auditoría
  createdBy: string; // User ID (barbero o sistema)
  createdMethod: 'automatic' | 'manual';
  adjustmentReason?: string; // Si fue manual

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type RewardStatus = 'generated' | 'active' | 'in_use' | 'redeemed' | 'expired' | 'cancelled';

export interface LoyaltyReward {
  rewardId: string;
  userId: string;
  franchiseId: string;
  code: string; // Código único para validar

  // Estado
  status: RewardStatus;

  // Generación
  generatedAt: Timestamp;
  generatedFromStamps: string[]; // IDs de sellos que lo generaron

  // Expiración
  expiresAt: Timestamp | null;
  expiredAt?: Timestamp;
  extensionCount?: number; // Veces que se extendió

  // Redención
  redeemedAt?: Timestamp;
  redeemedBy?: string; // Barbero ID
  redeemedAtBranch?: string;
  queueId?: string; // Ticket donde se usó

  // Metadata del premio
  rewardType: 'free_service';
  serviceId: string; // Servicio gratis (ej: 'haircut')
  value: number; // Valor monetario del premio en céntimos

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LoyaltyConfig {
  franchiseId: string;

  enabled: boolean;
  stampsRequired: number;

  stampExpiration: {
    enabled: boolean;
    days: number; // Días hasta expiración
  };

  rewardExpiration: {
    enabled: boolean;
    days: number; // Días hasta expiración
  };

  eligibleServices: {
    mode: 'all' | 'specific';
    serviceIds: string[]; // Si mode='specific', lista de IDs
  };

  stampsPerVisit: {
    mode: 'one_per_ticket' | 'one_per_service';
    maxPerTicket: number; // Máximo sellos por ticket
  };

  autoApplyReward: boolean; // ¿Aplicar premio automáticamente?

  notifications: {
    onStampEarned: boolean;
    onRewardGenerated: boolean;
    onRewardExpiring: boolean;
    onStampExpiring: boolean;
    expiringDaysBefore: number; // Días antes para notificar
  };

  crossBranchRedemption: boolean; // ¿Canjear en cualquier sucursal?
  allowStampOnFreeService: boolean; // ¿Dar sello en servicios gratuitos?
  preventSelfStamping: boolean; // ¿Prevenir auto-sellos? (siempre true)

  // Auditoría
  updatedAt: Timestamp;
  updatedBy: string; // User ID del admin que actualizó
  createdAt: Timestamp;
}

export interface FranchiseLoyaltySummary {
  stamps: number;
  required: number;
  percentage: number;
}

export interface LoyaltyCustomerSummary {
  userId: string;

  // Por franquicia
  franchises: {
    [franchiseId: string]: {
      activeStamps: number;
      totalStampsEarned: number;
      totalRewardsGenerated: number;
      totalRewardsRedeemed: number;
      totalRewardsExpired: number;

      currentProgress: FranchiseLoyaltySummary;

      activeRewards: string[]; // IDs de premios activos

      lastStampAt?: Timestamp;
      lastRewardAt?: Timestamp;
    };
  };

  // Global
  totalStampsEarned: number;
  totalRewardsRedeemed: number;

  updatedAt: Timestamp;
  createdAt: Timestamp;
}

// Extensión del QueueTicket para incluir información de redención
export interface QueueTicketWithReward extends QueueTicket {
  loyaltyReward?: {
    rewardId: string;
    code: string;
    appliedAt: Timestamp;
    appliedBy: string; // Barbero ID
    discountAmount: number; // 100% del servicio si es gratis
    originalPrice: number;
    finalPrice: number; // 0 si gratis
  };

  pricingBreakdown?: {
    subtotal: number;
    loyaltyDiscount: number; // Descuento por premio
    otherDiscounts: number;
    taxes: number;
    total: number;
  };
}
