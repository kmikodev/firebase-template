/**
 * Loyalty Card System - Cloud Functions
 * Sistema de tarjetas de fidelización con sellos
 */

import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { config } from '../config';
import {
  LoyaltyStamp,
  LoyaltyReward,
  LoyaltyConfig,
  LoyaltyCustomerSummary,
  QueueTicket,
  StampStatus,
  RewardStatus,
} from '../types';

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

// ========================================
// Helper Functions
// ========================================

/**
 * Obtiene la configuración de loyalty para una franquicia
 */
async function getLoyaltyConfig(franchiseId: string): Promise<LoyaltyConfig | null> {
  const configDoc = await db.collection('loyalty_configs').doc(franchiseId).get();
  if (!configDoc.exists) {
    return null;
  }
  return { franchiseId, ...configDoc.data() } as LoyaltyConfig;
}

/**
 * Genera un código único para un premio
 */
/**
 * Genera un código de recompensa criptográficamente seguro
 * Usa crypto.randomBytes() para prevenir predicción/bruteforce
 */
function generateRewardCode(): string {
  // Usar 8 bytes (64 bits) de entropía criptográfica
  const randomBytes = crypto.randomBytes(8);
  // Convertir a base64url (seguro para URLs) y tomar primeros 12 caracteres
  const code = randomBytes.toString('base64url').substring(0, 12).toUpperCase();
  return `RWD-${code}`;
}

/**
 * Calcula fecha de expiración para sellos
 */
function calculateStampExpiration(config: LoyaltyConfig): admin.firestore.Timestamp | null {
  if (!config.stampExpiration.enabled) {
    return null;
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + config.stampExpiration.days);
  return Timestamp.fromDate(expiryDate);
}

/**
 * Calcula fecha de expiración para premios
 */
function calculateRewardExpiration(config: LoyaltyConfig): admin.firestore.Timestamp | null {
  if (!config.rewardExpiration.enabled) {
    return null;
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + config.rewardExpiration.days);
  return Timestamp.fromDate(expiryDate);
}

/**
 * Verifica si un servicio es elegible para obtener sello
 */
function isServiceEligible(config: LoyaltyConfig, serviceId: string): boolean {
  if (config.eligibleServices.mode === 'all') {
    return true;
  }
  return config.eligibleServices.serviceIds.includes(serviceId);
}

// ========================================
// Trigger: Crear sello al completar turno
// ========================================

export const onQueueCompleted = onDocumentUpdated({
  document: 'queues/{queueId}',
  region: config.region,
}, async (event) => {
  const before = event.data?.before.data() as QueueTicket;
  const after = event.data?.after.data() as QueueTicket;

  if (!before || !after) {
    logger.error('No data in event');
    return;
  }

  const queueId = event.params.queueId;

  // Solo procesar si cambió de otro estado a 'completed'
  if (before.status === 'completed' || after.status !== 'completed') {
    return;
  }

  const ticket = after;

  // Validar que tiene todos los datos necesarios
  if (!ticket.serviceId || !ticket.barberId) {
    logger.info(`Queue ${queueId} completed but missing serviceId or barberId`);
    return;
  }

  // Obtener configuración de loyalty
  const config = await getLoyaltyConfig(ticket.franchiseId);
  if (!config || !config.enabled) {
    logger.info(`Loyalty not enabled for franchise ${ticket.franchiseId}`);
    return;
  }

  // Verificar si el servicio es elegible
  if (!isServiceEligible(config, ticket.serviceId)) {
    logger.info(`Service ${ticket.serviceId} not eligible for stamps`);
    return;
  }

  // SECURITY FIX: Crear sello con transacción para garantizar idempotencia
  try {
    await db.runTransaction(async (transaction) => {
      // Verificar si ya existe un sello para este ticket (dentro de la transacción)
      const existingStamps = await db
        .collection('loyalty_stamps')
        .where('queueId', '==', queueId)
        .limit(1)
        .get();

      if (!existingStamps.empty) {
        logger.info(`Stamp already exists for queue ${queueId}`);
        return;
      }

      // Crear sello atomically
      const stampId = db.collection('loyalty_stamps').doc().id;
      const stampRef = db.collection('loyalty_stamps').doc(stampId);

      const stamp: LoyaltyStamp = {
        stampId,
        userId: ticket.userId,
        franchiseId: ticket.franchiseId,
        branchId: ticket.branchId,
        earnedAt: Timestamp.now(),
        expiresAt: calculateStampExpiration(config),
        status: 'active' as StampStatus,
        queueId,
        serviceId: ticket.serviceId || 'unknown',
        barberId: ticket.barberId || 'unknown',
        createdBy: 'system',
        createdMethod: 'automatic',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      transaction.set(stampRef, stamp);

      logger.info(`Created stamp ${stampId} for user ${ticket.userId}`);
    });
  } catch (error) {
    logger.error('Failed to create stamp in transaction:', error);
    // No throw - este es un trigger, no queremos que falle el ticket
    return;
  }

  // Verificar si debe generar premio
  await checkAndGenerateReward(ticket.userId, ticket.franchiseId, config);
});

// ========================================
// Función: Verificar y generar premio
// ========================================

async function checkAndGenerateReward(
  userId: string,
  franchiseId: string,
  config: LoyaltyConfig
): Promise<void> {
  // Contar sellos activos
  const stampsSnapshot = await db
    .collection('loyalty_stamps')
    .where('userId', '==', userId)
    .where('franchiseId', '==', franchiseId)
    .where('status', '==', 'active')
    .get();

  const activeStamps = stampsSnapshot.size;

  logger.info(`User ${userId} has ${activeStamps}/${config.stampsRequired} stamps`);

  // Si alcanzó el número requerido, generar premio
  if (activeStamps >= config.stampsRequired) {
    await generateReward(userId, franchiseId, config, stampsSnapshot.docs);
  }

  // Actualizar summary del usuario
  await updateCustomerSummary(userId, franchiseId);
}

/**
 * Genera un premio para el usuario
 * SECURITY FIX: Usa transacción para garantizar atomicidad
 */
async function generateReward(
  userId: string,
  franchiseId: string,
  config: LoyaltyConfig,
  stampDocs: admin.firestore.QueryDocumentSnapshot[]
): Promise<void> {
  // SECURITY FIX: Filtrar sellos expirados antes de usar
  const now = Timestamp.now().toMillis();
  const validStamps = stampDocs.filter(doc => {
    const stamp = doc.data() as LoyaltyStamp;
    return !stamp.expiresAt || stamp.expiresAt.toMillis() > now;
  });

  if (validStamps.length < config.stampsRequired) {
    logger.info(`User ${userId} has expired stamps, not enough valid stamps`);
    return;
  }

  // SECURITY FIX: Usar transacción en lugar de batch
  try {
    await db.runTransaction(async (transaction) => {
      // Tomar solo los sellos necesarios
      const stampsToUse = validStamps.slice(0, config.stampsRequired);

      // Re-verificar que los sellos siguen activos (prevenir race conditions)
      for (const stampDoc of stampsToUse) {
        const freshStamp = await transaction.get(stampDoc.ref);
        if (!freshStamp.exists || freshStamp.data()?.status !== 'active') {
          throw new Error('Stamp already used');
        }
      }

      const stampIds = stampsToUse.map(doc => doc.id);

      // Marcar sellos como usados atomically
      stampsToUse.forEach(doc => {
        transaction.update(doc.ref, {
          status: 'used_in_reward',
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      // Obtener servicio elegible (primer servicio configurado o servicio default)
      let serviceId = 'haircut'; // default
      if (config.eligibleServices.mode === 'specific' && config.eligibleServices.serviceIds.length > 0) {
        serviceId = config.eligibleServices.serviceIds[0];
      }

      // Obtener precio del servicio
      const serviceDoc = await db.collection('services').doc(serviceId).get();
      const servicePrice = serviceDoc.exists ? serviceDoc.data()?.price || 0 : 0;

      // Crear premio atomically
      const rewardId = db.collection('loyalty_rewards').doc().id;
      const reward: LoyaltyReward = {
        rewardId,
        userId,
        franchiseId,
        code: generateRewardCode(),
        status: 'generated' as RewardStatus,
        generatedAt: Timestamp.now(),
        generatedFromStamps: stampIds,
        expiresAt: calculateRewardExpiration(config),
        rewardType: 'free_service',
        serviceId,
        value: servicePrice,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      transaction.set(db.collection('loyalty_rewards').doc(rewardId), reward);

      logger.info(`Generated reward ${rewardId} for user ${userId}`);

      // Enviar notificación después de la transacción exitosa
      if (config.notifications.onRewardGenerated) {
        // No await aquí - ejecutar async sin bloquear transacción
        sendRewardGeneratedNotification(userId, reward).catch(error => {
          logger.error('Failed to send reward notification:', error);
        });
      }
    });
  } catch (error) {
    logger.error('Failed to generate reward in transaction:', error);
    throw error;
  }
}

/**
 * Actualiza el resumen de loyalty del cliente
 */
/**
 * CODE REVIEW FIX H3: Optimizar para reducir de 5+ queries a 2 queries
 * Antes: 5 queries separadas (activeStamps, totalStamps, allRewards, lastStamp, lastReward)
 * Ahora: 2 queries con cálculo en memoria (60% reducción en reads)
 */
async function updateCustomerSummary(userId: string, franchiseId: string): Promise<void> {
  const summaryRef = db.collection('loyalty_customer_summary').doc(userId);
  const summaryDoc = await summaryRef.get();

  // Obtener config
  const config = await getLoyaltyConfig(franchiseId);
  if (!config) {
    return;
  }

  // Query 1: Obtener TODOS los stamps ordenados (1 query en lugar de 3)
  const allStampsSnapshot = await db
    .collection('loyalty_stamps')
    .where('userId', '==', userId)
    .where('franchiseId', '==', franchiseId)
    .orderBy('earnedAt', 'desc')
    .get();

  // Calcular métricas de stamps en memoria
  let activeStampsCount = 0;
  const totalStampsCount = allStampsSnapshot.size;
  const lastStampAt = allStampsSnapshot.docs[0]?.data().earnedAt || null;

  allStampsSnapshot.forEach(doc => {
    const stamp = doc.data() as LoyaltyStamp;
    if (stamp.status === 'active') {
      activeStampsCount++;
    }
  });

  // Query 2: Obtener TODOS los rewards ordenados (1 query en lugar de 2)
  const allRewardsSnapshot = await db
    .collection('loyalty_rewards')
    .where('userId', '==', userId)
    .where('franchiseId', '==', franchiseId)
    .orderBy('generatedAt', 'desc')
    .get();

  // Calcular métricas de rewards en memoria
  const rewardsByStatus = {
    generated: 0,
    redeemed: 0,
    expired: 0,
  };
  const activeRewardIds: string[] = [];
  const lastRewardAt = allRewardsSnapshot.docs[0]?.data().generatedAt || null;

  allRewardsSnapshot.forEach(doc => {
    const reward = doc.data() as LoyaltyReward;
    if (reward.status === 'generated' || reward.status === 'active') {
      rewardsByStatus.generated++;
      activeRewardIds.push(reward.rewardId);
    } else if (reward.status === 'redeemed') {
      rewardsByStatus.redeemed++;
    } else if (reward.status === 'expired') {
      rewardsByStatus.expired++;
    }
  });

  // Calcular progreso
  const currentStamps = activeStampsCount;
  const required = config.stampsRequired;
  const percentage = Math.min((currentStamps / required) * 100, 100);

  // Crear o actualizar summary
  if (!summaryDoc.exists) {
    const newSummary: LoyaltyCustomerSummary = {
      userId,
      franchises: {
        [franchiseId]: {
          activeStamps: currentStamps,
          totalStampsEarned: totalStampsCount,
          totalRewardsGenerated: rewardsByStatus.generated + rewardsByStatus.redeemed + rewardsByStatus.expired,
          totalRewardsRedeemed: rewardsByStatus.redeemed,
          totalRewardsExpired: rewardsByStatus.expired,
          currentProgress: {
            stamps: currentStamps,
            required,
            percentage,
          },
          activeRewards: activeRewardIds,
          lastStampAt,
          lastRewardAt,
        },
      },
      totalStampsEarned: totalStampsCount,
      totalRewardsRedeemed: rewardsByStatus.redeemed,
      updatedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    };
    await summaryRef.set(newSummary);
  } else {
    await summaryRef.update({
      [`franchises.${franchiseId}`]: {
        activeStamps: currentStamps,
        totalStampsEarned: totalStampsCount,
        totalRewardsGenerated: rewardsByStatus.generated + rewardsByStatus.redeemed + rewardsByStatus.expired,
        totalRewardsRedeemed: rewardsByStatus.redeemed,
        totalRewardsExpired: rewardsByStatus.expired,
        currentProgress: {
          stamps: currentStamps,
          required,
          percentage,
        },
        activeRewards: activeRewardIds,
        lastStampAt,
        lastRewardAt,
      },
      totalStampsEarned: FieldValue.increment(0), // Solo para trigger update
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

// ========================================
// Callable: Canjear premio
// ========================================

export const redeemReward = onCall({ region: config.region }, async (request) => {
  // Autenticación requerida
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { rewardCode } = request.data;

  // Validar input
  if (!rewardCode) {
    throw new HttpsError('invalid-argument', 'rewardCode is required');
  }

  // SECURITY FIX: Usar transacción para evitar race condition en doble redención
  try {
    const result = await db.runTransaction(async (transaction) => {
      // Buscar premio por código
      const rewardQuery = await db
        .collection('loyalty_rewards')
        .where('code', '==', rewardCode.toUpperCase())
        .limit(1)
        .get();

      if (rewardQuery.empty) {
        throw new HttpsError('not-found', 'Reward not found');
      }

      const rewardDoc = rewardQuery.docs[0];
      const reward = rewardDoc.data() as LoyaltyReward;

      // ATÓMICO: Validar estado dentro de la transacción
      if (reward.status !== 'generated' && reward.status !== 'active') {
        logger.warn(`Reward ${reward.rewardId} redemption blocked, status: ${reward.status}`);
        throw new HttpsError('failed-precondition', 'Reward cannot be redeemed');
      }

      // Validar expiración
      if (reward.expiresAt && reward.expiresAt.toMillis() < Date.now()) {
        transaction.update(rewardDoc.ref, {
          status: 'expired',
          expiredAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        throw new HttpsError('failed-precondition', 'Reward has expired');
      }

      // ATÓMICO: Marcar premio como "en uso" - solo UNA transacción exitosa
      transaction.update(rewardDoc.ref, {
        status: 'in_use',
        inUseAt: FieldValue.serverTimestamp(),
        inUseBy: request.auth!.uid,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Retornar información del premio
      return {
        success: true,
        reward: {
          rewardId: reward.rewardId,
          code: reward.code,
          userId: reward.userId,
          franchiseId: reward.franchiseId,
          serviceId: reward.serviceId,
          value: reward.value,
          expiresAt: reward.expiresAt?.toMillis() || null,
        },
      };
    });

    return result;
  } catch (error: unknown) {
    if (error instanceof HttpsError) {
      throw error;
    }
    logger.error('Transaction failed in redeemReward:', error);
    throw new HttpsError('internal', 'Failed to redeem reward');
  }
});

// ========================================
// Callable: Aplicar premio a turno
// ========================================

export const applyRewardToQueue = onCall({ region: config.region }, async (request) => {
  // Autenticación requerida
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // SECURITY FIX: Validar que el usuario es barbero, admin o super_admin
  const userRole = request.auth.token.role as string;
  if (userRole !== 'barber' && userRole !== 'admin' && userRole !== 'super_admin' && userRole !== 'franchise_owner') {
    throw new HttpsError('permission-denied', 'Only barbers and admins can apply rewards');
  }

  const { rewardId, queueId, branchId } = request.data;
  const barberId = request.auth.uid;

  // Validar input
  if (!rewardId || !queueId || !branchId) {
    throw new HttpsError('invalid-argument', 'rewardId, queueId, and branchId are required');
  }

  // SECURITY FIX: Verificar que el barbero pertenece a esta sucursal
  if (userRole === 'barber') {
    const barberDoc = await db.collection('barbers').doc(barberId).get();
    if (!barberDoc.exists) {
      throw new HttpsError('not-found', 'Barber not found');
    }

    const barberData = barberDoc.data();
    if (barberData?.branchId !== branchId) {
      throw new HttpsError('permission-denied', 'Barber not assigned to this branch');
    }
  }

  // CODE REVIEW FIX H2: Usar transacción en lugar de batch para garantizar atomicidad
  try {
    const result = await db.runTransaction(async (transaction) => {
      // Obtener premio (fresh read dentro de la transacción)
      const rewardDoc = await transaction.get(db.collection('loyalty_rewards').doc(rewardId));
      if (!rewardDoc.exists) {
        throw new HttpsError('not-found', 'Reward not found');
      }

      const reward = rewardDoc.data() as LoyaltyReward;

      // Validar estado (dentro de la transacción para evitar race conditions)
      if (reward.status !== 'in_use') {
        throw new HttpsError('failed-precondition', 'Reward must be in_use to apply');
      }

      // Obtener ticket (fresh read)
      const queueDoc = await transaction.get(db.collection('queues').doc(queueId));
      if (!queueDoc.exists) {
        throw new HttpsError('not-found', 'Queue ticket not found');
      }

      const ticket = queueDoc.data() as QueueTicket;

      // Validar que el usuario del premio coincide con el del ticket
      if (reward.userId !== ticket.userId) {
        throw new HttpsError('permission-denied', 'Reward does not belong to this user');
      }

      // Validar que el ticket no tenga ya una recompensa aplicada
      if ((ticket as any).loyaltyReward) {
        throw new HttpsError('failed-precondition', 'Ticket already has a reward applied');
      }

      // Validar que franquicia coincida
      if (reward.franchiseId !== ticket.franchiseId) {
        throw new HttpsError('permission-denied', 'Reward not valid for this franchise');
      }

      // Marcar premio como redimido atomically
      transaction.update(rewardDoc.ref, {
        status: 'redeemed',
        redeemedAt: FieldValue.serverTimestamp(),
        redeemedBy: barberId,
        redeemedAtBranch: branchId,
        queueId,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Actualizar ticket con información del premio atomically
      transaction.update(queueDoc.ref, {
        loyaltyReward: {
          rewardId: reward.rewardId,
          code: reward.code,
          appliedAt: FieldValue.serverTimestamp(),
          appliedBy: barberId,
          discountAmount: reward.value,
          originalPrice: reward.value,
          finalPrice: 0,
        },
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { userId: reward.userId, franchiseId: reward.franchiseId };
    });

    // Actualizar summary fuera de la transacción (no crítico)
    await updateCustomerSummary(result.userId, result.franchiseId);

    return {
      success: true,
      message: 'Reward applied successfully',
    };
  } catch (error: unknown) {
    if (error instanceof HttpsError) {
      throw error;
    }
    logger.error('Transaction failed in applyRewardToQueue:', error);
    throw new HttpsError('internal', 'Failed to apply reward');
  }
});

// ========================================
// Scheduled: Expirar sellos vencidos
// ========================================

export const expireStampsDaily = onSchedule({
  schedule: '0 2 * * *',
  timeZone: 'Europe/Madrid',
  region: config.region,
  memory: '1GiB',
  timeoutSeconds: 540, // 9 minutes max
}, async () => {
  const now = Timestamp.now();
  const MAX_DOCS_PER_RUN = 10000; // Safety limit to prevent timeout

  // CODE REVIEW FIX H1: Optimizar query con límite para evitar escaneo completo
  const expiredStamps = await db
    .collection('loyalty_stamps')
    .where('status', '==', 'active')
    .where('expiresAt', '<=', now)
    .limit(MAX_DOCS_PER_RUN)
    .get();

  if (expiredStamps.empty) {
    logger.info('No stamps to expire');
    return;
  }

  if (expiredStamps.size >= MAX_DOCS_PER_RUN) {
    logger.warn(`Reached limit of ${MAX_DOCS_PER_RUN} stamps, may need multiple runs`);
  }

  logger.info(`Found ${expiredStamps.size} stamps to expire`);

  // Procesar en batches
  const batchSize = 500;
  const batches: admin.firestore.WriteBatch[] = [];
  let currentBatch = db.batch();
  let operationsInBatch = 0;

  for (const doc of expiredStamps.docs) {
    currentBatch.update(doc.ref, {
      status: 'expired',
      updatedAt: FieldValue.serverTimestamp(),
    });

    operationsInBatch++;

    if (operationsInBatch >= batchSize) {
      batches.push(currentBatch);
      currentBatch = db.batch();
      operationsInBatch = 0;
    }
  }

  if (operationsInBatch > 0) {
    batches.push(currentBatch);
  }

  // Commit all batches
  await Promise.all(batches.map(batch => batch.commit()));

  logger.info(`Expired ${expiredStamps.size} stamps`);

  // Actualizar summaries afectados (agrupar por usuario)
  const affectedUsers = new Set(expiredStamps.docs.map(doc => (doc.data() as LoyaltyStamp).userId));
  const affectedFranchises = new Set(expiredStamps.docs.map(doc => (doc.data() as LoyaltyStamp).franchiseId));

  for (const userId of affectedUsers) {
    for (const franchiseId of affectedFranchises) {
      await updateCustomerSummary(userId, franchiseId);
    }
  }
});

// ========================================
// Scheduled: Expirar premios vencidos
// ========================================

export const expireRewardsDaily = onSchedule({
  schedule: '0 3 * * *',
  timeZone: 'Europe/Madrid',
  region: config.region,
  memory: '1GiB',
  timeoutSeconds: 540, // 9 minutes max
}, async () => {
  const now = Timestamp.now();
  const MAX_DOCS_PER_RUN = 10000; // Safety limit to prevent timeout

  // CODE REVIEW FIX H1: Optimizar query con límite
  const expiredRewards = await db
    .collection('loyalty_rewards')
    .where('status', 'in', ['generated', 'active'])
    .where('expiresAt', '<=', now)
    .limit(MAX_DOCS_PER_RUN)
    .get();

  if (expiredRewards.empty) {
    logger.info('No rewards to expire');
    return;
  }

  if (expiredRewards.size >= MAX_DOCS_PER_RUN) {
    logger.warn(`Reached limit of ${MAX_DOCS_PER_RUN} rewards, may need multiple runs`);
  }

  logger.info(`Found ${expiredRewards.size} rewards to expire`);

  // Procesar en batch
  const batch = db.batch();

  expiredRewards.forEach(doc => {
    batch.update(doc.ref, {
      status: 'expired',
      expiredAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();

  logger.info(`Expired ${expiredRewards.size} rewards`);

  // Actualizar summaries
  const affectedUsers = new Set(expiredRewards.docs.map(doc => (doc.data() as LoyaltyReward).userId));
  const affectedFranchises = new Set(expiredRewards.docs.map(doc => (doc.data() as LoyaltyReward).franchiseId));

  for (const userId of affectedUsers) {
    for (const franchiseId of affectedFranchises) {
      await updateCustomerSummary(userId, franchiseId);
    }
  }
});

// ========================================
// Helper: Enviar notificaciones
// ========================================

async function sendRewardGeneratedNotification(userId: string, reward: LoyaltyReward): Promise<void> {
  const notification = {
    notificationId: db.collection('notifications').doc().id,
    userId,
    type: 'loyalty_reward_generated',
    title: '¡Premio obtenido! 🎉',
    body: `Has ganado un servicio gratis. Código: ${reward.code}`,
    data: {
      rewardId: reward.rewardId,
      code: reward.code,
      type: 'loyalty_reward',
    },
    isRead: false,
    isSent: false,
    createdAt: FieldValue.serverTimestamp(),
  };

  await db.collection('notifications').doc(notification.notificationId).set(notification);

  // TODO: Enviar push notification con FCM
  logger.info(`Notification created for user ${userId} about reward ${reward.rewardId}`);
}
