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
