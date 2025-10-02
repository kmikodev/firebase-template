/**
 * Tipos compartidos con el backend (Cloud Functions)
 * Mantener sincronizado con functions/src/types/index.ts
 */

import { Timestamp } from 'firebase/firestore';

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
  franchiseId?: string;
  branchId?: string;
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
  ownerUserId: string;
  logo?: string;
  description?: string;
  website?: string;
  email: string;
  phone: string;
  stripeAccountId?: string;
  stripeSubscriptionId?: string;
  planTier: 'free' | 'basic' | 'premium' | 'enterprise';
  planExpiresAt?: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Branch {
  branchId: string;
  franchiseId: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  phone: string;
  email?: string;
  photo?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  schedule: BranchSchedule;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BranchSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  open?: string; // "09:00"
  close?: string; // "21:00"
  breakStart?: string; // "14:00"
  breakEnd?: string; // "16:00"
}

// ========================================
// Barber Types
// ========================================

export interface Barber {
  barberId: string;
  userId: string;
  franchiseId: string;
  branchId: string;
  displayName: string;
  photoURL?: string;
  specialties: string[];
  bio?: string;
  schedule: BarberSchedule;
  isActive: boolean;
  isAvailable: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BarberSchedule {
  monday: BarberDaySchedule;
  tuesday: BarberDaySchedule;
  wednesday: BarberDaySchedule;
  thursday: BarberDaySchedule;
  friday: BarberDaySchedule;
  saturday: BarberDaySchedule;
  sunday: BarberDaySchedule;
}

export interface BarberDaySchedule {
  isWorking: boolean;
  workStart?: string; // "09:00"
  workEnd?: string; // "21:00"
  breakStart?: string; // "14:00"
  breakEnd?: string; // "16:00"
}

// ========================================
// Service Types
// ========================================

export interface Service {
  serviceId: string;
  franchiseId: string;
  name: string;
  description?: string;
  duration: number; // minutos
  price: number; // céntimos (EUR)
  category: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ========================================
// Queue Types
// ========================================

export type QueueStatus =
  | 'waiting'
  | 'notified'
  | 'arrived'
  | 'in_service'
  | 'completed'
  | 'cancelled'
  | 'expired';

export interface QueueTicket {
  queueId: string;
  franchiseId: string;
  branchId: string;
  userId: string;
  position: number;
  ticketNumber: string;
  status: QueueStatus;
  serviceId?: string;
  barberId?: string;
  estimatedWaitTime: number; // minutos
  timerExpiry?: Timestamp;
  arrivedAt?: Timestamp;
  calledAt?: Timestamp;
  completedAt?: Timestamp;
  cancelledAt?: Timestamp;
  expiredAt?: Timestamp;
  cancelReason?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ========================================
// Notification Types
// ========================================

export enum NotificationType {
  TICKET_CONFIRMED = 'ticket_confirmed',
  POSITION_UPDATE = 'position_update',
  YOUR_TURN = 'your_turn',
  ARRIVAL_REMINDER = 'arrival_reminder',
  TICKET_EXPIRED = 'ticket_expired',
  TICKET_CANCELLED = 'ticket_cancelled',
  QUEUE_PAUSED = 'queue_paused',
  QUEUE_RESUMED = 'queue_resumed',
}

export interface Notification {
  notificationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  isSent: boolean;
  sentAt?: Timestamp;
  readAt?: Timestamp;
  createdAt: Timestamp;
}

// ========================================
// Loyalty Types
// ========================================

export type LoyaltyTransactionType =
  | 'ticket_completed'
  | 'no_arrival'
  | 'no_show'
  | 'cancelled_late'
  | 'manual_adjustment';

export interface LoyaltyTransaction {
  transactionId: string;
  userId: string;
  queueId?: string;
  type: LoyaltyTransactionType;
  points: number; // positivo o negativo
  balanceBefore: number;
  balanceAfter: number;
  reason?: string;
  createdAt: Timestamp;
}

// ========================================
// Offer Types
// ========================================

export type OfferType = 'discount' | 'bogo' | 'free_service' | 'points_bonus';

export interface Offer {
  offerId: string;
  franchiseId: string;
  branchId?: string; // Si está vacío, aplica a todas las sucursales
  title: string;
  description: string;
  type: OfferType;
  imageURL?: string;
  discountPercentage?: number; // Para type='discount'
  discountAmount?: number; // Para type='discount' (céntimos)
  serviceIds?: string[]; // Servicios específicos afectados
  minPurchase?: number; // Compra mínima requerida (céntimos)
  maxDiscount?: number; // Descuento máximo (céntimos)
  pointsBonus?: number; // Para type='points_bonus'
  code?: string; // Código promocional opcional
  isActive: boolean;
  startDate: Timestamp;
  endDate: Timestamp;
  usageLimit?: number; // Límite total de usos
  usageCount: number; // Contador de usos actuales
  userLimit?: number; // Límite de usos por usuario
  termsAndConditions?: string;
  createdBy: string; // userId del creador
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OfferUsage {
  usageId: string;
  offerId: string;
  userId: string;
  queueId?: string;
  usedAt: Timestamp;
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
