/**
 * Loyalty Card Service
 * Servicio para gestionar el sistema de tarjetas de fidelización
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import type {
  LoyaltyStamp,
  LoyaltyReward,
  LoyaltyConfig,
  LoyaltyCustomerSummary,
} from '@/types';

// ========================================
// Consultas de Firestore
// ========================================

/**
 * Obtiene los sellos activos de un usuario en una franquicia
 */
export async function getUserStamps(
  userId: string,
  franchiseId: string
): Promise<LoyaltyStamp[]> {
  const stampsQuery = query(
    collection(db, 'loyalty_stamps'),
    where('userId', '==', userId),
    where('franchiseId', '==', franchiseId),
    where('status', '==', 'active'),
    orderBy('earnedAt', 'desc')
  );

  const snapshot = await getDocs(stampsQuery);
  return snapshot.docs.map(doc => ({ ...doc.data(), stampId: doc.id } as LoyaltyStamp));
}

/**
 * Obtiene el historial completo de sellos de un usuario en una franquicia
 */
export async function getUserStampsHistory(
  userId: string,
  franchiseId: string,
  maxResults = 100
): Promise<LoyaltyStamp[]> {
  const stampsQuery = query(
    collection(db, 'loyalty_stamps'),
    where('userId', '==', userId),
    where('franchiseId', '==', franchiseId),
    orderBy('earnedAt', 'desc'),
    limit(maxResults)
  );

  const snapshot = await getDocs(stampsQuery);
  return snapshot.docs.map(doc => ({ ...doc.data(), stampId: doc.id } as LoyaltyStamp));
}

/**
 * Obtiene los premios activos de un usuario
 */
export async function getUserRewards(
  userId: string,
  franchiseId?: string
): Promise<LoyaltyReward[]> {
  let rewardsQuery = query(
    collection(db, 'loyalty_rewards'),
    where('userId', '==', userId),
    where('status', 'in', ['generated', 'active']),
    orderBy('generatedAt', 'desc')
  );

  if (franchiseId) {
    rewardsQuery = query(
      collection(db, 'loyalty_rewards'),
      where('userId', '==', userId),
      where('franchiseId', '==', franchiseId),
      where('status', 'in', ['generated', 'active']),
      orderBy('generatedAt', 'desc')
    );
  }

  const snapshot = await getDocs(rewardsQuery);
  return snapshot.docs.map(doc => ({ ...doc.data(), rewardId: doc.id } as LoyaltyReward));
}

/**
 * Obtiene el historial de premios de un usuario
 */
export async function getUserRewardsHistory(
  userId: string,
  franchiseId?: string,
  maxResults = 50
): Promise<LoyaltyReward[]> {
  let rewardsQuery = query(
    collection(db, 'loyalty_rewards'),
    where('userId', '==', userId),
    orderBy('generatedAt', 'desc'),
    limit(maxResults)
  );

  if (franchiseId) {
    rewardsQuery = query(
      collection(db, 'loyalty_rewards'),
      where('userId', '==', userId),
      where('franchiseId', '==', franchiseId),
      orderBy('generatedAt', 'desc'),
      limit(maxResults)
    );
  }

  const snapshot = await getDocs(rewardsQuery);
  return snapshot.docs.map(doc => ({ ...doc.data(), rewardId: doc.id } as LoyaltyReward));
}

/**
 * Obtiene un premio por su código
 */
export async function getRewardByCode(code: string): Promise<LoyaltyReward | null> {
  const rewardsQuery = query(
    collection(db, 'loyalty_rewards'),
    where('code', '==', code.toUpperCase()),
    limit(1)
  );

  const snapshot = await getDocs(rewardsQuery);
  if (snapshot.empty) {
    return null;
  }

  return { ...snapshot.docs[0].data(), rewardId: snapshot.docs[0].id } as LoyaltyReward;
}

/**
 * Obtiene el resumen de loyalty de un usuario
 */
export async function getUserSummary(userId: string): Promise<LoyaltyCustomerSummary | null> {
  const summaryDoc = await getDoc(doc(db, 'loyalty_customer_summary', userId));
  if (!summaryDoc.exists()) {
    return null;
  }

  return { userId, ...summaryDoc.data() } as LoyaltyCustomerSummary;
}

/**
 * Obtiene la configuración de loyalty de una franquicia
 */
export async function getLoyaltyConfig(franchiseId: string): Promise<LoyaltyConfig | null> {
  const configDoc = await getDoc(doc(db, 'loyalty_configs', franchiseId));
  if (!configDoc.exists()) {
    return null;
  }

  return { franchiseId, ...configDoc.data() } as LoyaltyConfig;
}

// ========================================
// Listeners en tiempo real
// ========================================

/**
 * Listener para el resumen de loyalty del usuario
 */
export function subscribeToUserSummary(
  userId: string,
  callback: (summary: LoyaltyCustomerSummary | null) => void
): Unsubscribe {
  const summaryRef = doc(db, 'loyalty_customer_summary', userId);

  return onSnapshot(summaryRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ userId, ...snapshot.data() } as LoyaltyCustomerSummary);
    } else {
      callback(null);
    }
  });
}

/**
 * Listener para los premios activos del usuario
 */
export function subscribeToUserRewards(
  userId: string,
  franchiseId: string,
  callback: (rewards: LoyaltyReward[]) => void
): Unsubscribe {
  const rewardsQuery = query(
    collection(db, 'loyalty_rewards'),
    where('userId', '==', userId),
    where('franchiseId', '==', franchiseId),
    where('status', 'in', ['generated', 'active']),
    orderBy('generatedAt', 'desc')
  );

  return onSnapshot(rewardsQuery, (snapshot) => {
    const rewards = snapshot.docs.map(doc => ({
      ...doc.data(),
      rewardId: doc.id,
    } as LoyaltyReward));
    callback(rewards);
  });
}

/**
 * Listener para los sellos activos del usuario
 */
export function subscribeToUserStamps(
  userId: string,
  franchiseId: string,
  callback: (stamps: LoyaltyStamp[]) => void
): Unsubscribe {
  const stampsQuery = query(
    collection(db, 'loyalty_stamps'),
    where('userId', '==', userId),
    where('franchiseId', '==', franchiseId),
    where('status', '==', 'active'),
    orderBy('earnedAt', 'desc')
  );

  return onSnapshot(stampsQuery, (snapshot) => {
    const stamps = snapshot.docs.map(doc => ({
      ...doc.data(),
      stampId: doc.id,
    } as LoyaltyStamp));
    callback(stamps);
  });
}

// ========================================
// Cloud Functions Callable
// ========================================

interface RedeemRewardRequest {
  rewardCode: string;
}

interface RedeemRewardResponse {
  success: boolean;
  reward?: {
    rewardId: string;
    code: string;
    userId: string;
    franchiseId: string;
    serviceId: string;
    value: number;
    expiresAt: number | null;
  };
  error?: string;
}

/**
 * Canjea un premio (lo marca como "en uso")
 */
export async function redeemReward(rewardCode: string): Promise<RedeemRewardResponse> {
  try {
    const callable = httpsCallable<RedeemRewardRequest, RedeemRewardResponse>(
      functions,
      'redeemReward'
    );

    const result = await callable({ rewardCode });
    return result.data;
  } catch (error: any) {
    console.error('Error redeeming reward:', error);
    return {
      success: false,
      error: error.message || 'Error al canjear premio',
    };
  }
}

interface ApplyRewardRequest {
  rewardId: string;
  queueId: string;
  branchId: string;
}

interface ApplyRewardResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Aplica un premio a un turno
 */
export async function applyRewardToQueue(
  rewardId: string,
  queueId: string,
  branchId: string
): Promise<ApplyRewardResponse> {
  try {
    const callable = httpsCallable<ApplyRewardRequest, ApplyRewardResponse>(
      functions,
      'applyRewardToQueue'
    );

    const result = await callable({ rewardId, queueId, branchId });
    return result.data;
  } catch (error: any) {
    console.error('Error applying reward to queue:', error);
    return {
      success: false,
      error: error.message || 'Error al aplicar premio',
    };
  }
}

// ========================================
// Helpers
// ========================================

/**
 * Verifica si un premio está expirado
 */
export function isRewardExpired(reward: LoyaltyReward): boolean {
  if (!reward.expiresAt) {
    return false;
  }

  const now = Timestamp.now().toMillis();
  const expiry = reward.expiresAt.toMillis();

  return expiry < now;
}

/**
 * Calcula días hasta que expire un premio
 */
export function daysUntilRewardExpires(reward: LoyaltyReward): number | null {
  if (!reward.expiresAt) {
    return null;
  }

  const now = Timestamp.now().toMillis();
  const expiry = reward.expiresAt.toMillis();
  const diff = expiry - now;

  if (diff < 0) {
    return 0;
  }

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Formatea una fecha de Timestamp a string legible
 */
export function formatTimestamp(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Calcula el progreso hacia el siguiente premio
 */
export function calculateProgress(
  activeStamps: number,
  requiredStamps: number
): {
  current: number;
  required: number;
  percentage: number;
  remaining: number;
} {
  return {
    current: activeStamps,
    required: requiredStamps,
    percentage: Math.min((activeStamps / requiredStamps) * 100, 100),
    remaining: Math.max(requiredStamps - activeStamps, 0),
  };
}
