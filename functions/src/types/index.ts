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
