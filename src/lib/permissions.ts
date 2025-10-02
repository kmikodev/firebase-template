/**
 * Permission utilities for role-based access control
 */
import { CustomClaims } from '@/types';

/**
 * Check if user can manage (create/update/delete) a franchise
 */
export function canManageFranchise(claims: CustomClaims | null, franchiseId: string): boolean {
  if (!claims) return false;

  return (
    claims.role === 'super_admin' ||
    (claims.role === 'franchise_owner' && claims.franchiseId === franchiseId)
  );
}

/**
 * Check if user can manage a branch
 */
export function canManageBranch(claims: CustomClaims | null, franchiseId: string): boolean {
  if (!claims) return false;

  return (
    claims.role === 'super_admin' ||
    (claims.franchiseId === franchiseId &&
     ['franchise_owner', 'admin'].includes(claims.role))
  );
}

/**
 * Check if user can manage a barber
 */
export function canManageBarber(claims: CustomClaims | null, franchiseId: string): boolean {
  return canManageBranch(claims, franchiseId);
}

/**
 * Check if user can manage services
 */
export function canManageService(claims: CustomClaims | null, franchiseId: string): boolean {
  return canManageBranch(claims, franchiseId);
}

/**
 * Check if user can view franchise data (broader access)
 */
export function canViewFranchiseData(claims: CustomClaims | null, franchiseId: string): boolean {
  if (!claims) return false;

  return (
    claims.role === 'super_admin' ||
    claims.franchiseId === franchiseId
  );
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(claims: CustomClaims | null): boolean {
  return claims?.role === 'super_admin';
}

/**
 * Check if user is franchise owner
 */
export function isFranchiseOwner(claims: CustomClaims | null): boolean {
  return claims?.role === 'franchise_owner';
}

/**
 * Check if user is admin (branch manager)
 */
export function isAdmin(claims: CustomClaims | null): boolean {
  return claims?.role === 'admin';
}

/**
 * Check if user is barber
 */
export function isBarber(claims: CustomClaims | null): boolean {
  return claims?.role === 'barber';
}

/**
 * Check if user has staff role (franchise_owner, admin, or barber)
 */
export function isStaff(claims: CustomClaims | null): boolean {
  if (!claims) return false;

  return ['super_admin', 'franchise_owner', 'admin', 'barber'].includes(claims.role);
}
