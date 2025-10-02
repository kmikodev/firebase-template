/**
 * Zod schemas para validación runtime de datos de Firebase
 */
import { z } from 'zod';

// ========================================
// User & Auth Schemas
// ========================================

export const UserRoleSchema = z.enum([
  'super_admin',
  'franchise_owner',
  'admin',
  'barber',
  'client',
  'guest',
]);

export const CustomClaimsSchema = z.object({
  role: UserRoleSchema.optional(),
  isAnonymous: z.boolean().optional(),
  franchiseId: z.string().optional(),
  branchId: z.string().optional(),
});

export const QueueHistorySchema = z.object({
  totalCompleted: z.number().min(0),
  totalNoShows: z.number().min(0),
  totalExpired: z.number().min(0),
  totalCancelled: z.number().min(0),
});

export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email().nullable(),
  displayName: z.string().min(1),
  photoURL: z.string().url().nullable(),
  phoneNumber: z.string().nullable(),
  role: UserRoleSchema,
  isAnonymous: z.boolean(),
  franchiseId: z.string().optional(),
  branchId: z.string().optional(),
  queuePoints: z.number(),
  queueHistory: QueueHistorySchema,
  createdAt: z.any(), // Timestamp de Firestore
  updatedAt: z.any(), // Timestamp de Firestore
});

// ========================================
// Franchise & Branch Schemas
// ========================================

export const FranchiseSchema = z.object({
  franchiseId: z.string().min(1),
  name: z.string().min(1),
  ownerUserId: z.string().min(1),
  logo: z.string().url().optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  email: z.string().email(),
  phone: z.string().min(1),
  stripeAccountId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  planTier: z.enum(['free', 'basic', 'premium', 'enterprise']),
  planExpiresAt: z.any().optional(), // Timestamp
  isActive: z.boolean(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export const DayScheduleSchema = z.object({
  isOpen: z.boolean(),
  open: z.string().regex(/^\d{2}:\d{2}$/).optional(), // "09:00"
  close: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  breakStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  breakEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export const BranchScheduleSchema = z.object({
  monday: DayScheduleSchema,
  tuesday: DayScheduleSchema,
  wednesday: DayScheduleSchema,
  thursday: DayScheduleSchema,
  friday: DayScheduleSchema,
  saturday: DayScheduleSchema,
  sunday: DayScheduleSchema,
});

export const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const BranchSchema = z.object({
  branchId: z.string().min(1),
  franchiseId: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  province: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  photo: z.string().url().optional(),
  location: LocationSchema.optional(),
  schedule: BranchScheduleSchema,
  isActive: z.boolean(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

// ========================================
// Validation Helper Functions
// ========================================

/**
 * Valida y parsea custom claims de forma segura
 */
export function parseCustomClaims(claims: unknown) {
  try {
    return CustomClaimsSchema.parse(claims);
  } catch (error) {
    console.error('Invalid custom claims:', error);
    return null;
  }
}

/**
 * Valida y parsea datos de usuario de Firestore
 */
export function parseUser(data: unknown) {
  try {
    return UserSchema.parse(data);
  } catch (error) {
    console.error('Invalid user data:', error);
    return null;
  }
}

/**
 * Valida y parsea datos de franquicia
 */
export function parseFranchise(data: unknown) {
  try {
    return FranchiseSchema.parse(data);
  } catch (error) {
    console.error('Invalid franchise data:', error);
    return null;
  }
}

/**
 * Valida y parsea datos de sucursal
 */
export function parseBranch(data: unknown) {
  try {
    return BranchSchema.parse(data);
  } catch (error) {
    console.error('Invalid branch data:', error);
    return null;
  }
}
