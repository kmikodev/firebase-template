/**
 * Loyalty Card System - Cloud Functions
 * Sistema de tarjetas de fidelización con sellos
 */

import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
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
function generateRewardCode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `RWD-${timestamp}-${random}`.toUpperCase();
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

  // Verificar si ya existe un sello para este ticket (idempotencia)
  const existingStamps = await db
    .collection('loyalty_stamps')
    .where('queueId', '==', queueId)
    .limit(1)
    .get();

  if (!existingStamps.empty) {
    logger.info(`Stamp already exists for queue ${queueId}`);
    return;
  }

  // Crear sello
  const stampId = db.collection('loyalty_stamps').doc().id;
  const stamp: LoyaltyStamp = {
    stampId,
    userId: ticket.userId,
    franchiseId: ticket.franchiseId,
    branchId: ticket.branchId,
    earnedAt: Timestamp.now(),
    expiresAt: calculateStampExpiration(config),
    status: 'active' as StampStatus,
    queueId,
    serviceId: ticket.serviceId,
    barberId: ticket.barberId,
    createdBy: 'system',
    createdMethod: 'automatic',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await db.collection('loyalty_stamps').doc(stampId).set(stamp);

  logger.info(`Created stamp ${stampId} for user ${ticket.userId}`);

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
 */
async function generateReward(
  userId: string,
  franchiseId: string,
  config: LoyaltyConfig,
  stampDocs: admin.firestore.QueryDocumentSnapshot[]
): Promise<void> {
  const batch = db.batch();

  // Tomar solo los sellos necesarios
  const stampsToUse = stampDocs.slice(0, config.stampsRequired);
  const stampIds = stampsToUse.map(doc => doc.id);

  // Marcar sellos como usados
  stampsToUse.forEach(doc => {
    batch.update(doc.ref, {
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

  // Crear premio
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

  batch.set(db.collection('loyalty_rewards').doc(rewardId), reward);

  await batch.commit();

  logger.info(`Generated reward ${rewardId} for user ${userId}`);

  // Enviar notificación
  if (config.notifications.onRewardGenerated) {
    await sendRewardGeneratedNotification(userId, reward);
  }
}

/**
 * Actualiza el resumen de loyalty del cliente
 */
async function updateCustomerSummary(userId: string, franchiseId: string): Promise<void> {
  const summaryRef = db.collection('loyalty_customer_summary').doc(userId);
  const summaryDoc = await summaryRef.get();

  // Obtener config
  const config = await getLoyaltyConfig(franchiseId);
  if (!config) {
    return;
  }

  // Contar stamps activos
  const activeStamps = await db
    .collection('loyalty_stamps')
    .where('userId', '==', userId)
    .where('franchiseId', '==', franchiseId)
    .where('status', '==', 'active')
    .get();

  // Contar total stamps
  const totalStamps = await db
    .collection('loyalty_stamps')
    .where('userId', '==', userId)
    .where('franchiseId', '==', franchiseId)
    .get();

  // Contar rewards
  const allRewards = await db
    .collection('loyalty_rewards')
    .where('userId', '==', userId)
    .where('franchiseId', '==', franchiseId)
    .get();

  const rewardsByStatus = {
    generated: 0,
    redeemed: 0,
    expired: 0,
  };

  const activeRewardIds: string[] = [];

  allRewards.forEach(doc => {
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
  const currentStamps = activeStamps.size;
  const required = config.stampsRequired;
  const percentage = Math.min((currentStamps / required) * 100, 100);

  // Obtener último sello y premio
  const lastStampQuery = await db
    .collection('loyalty_stamps')
    .where('userId', '==', userId)
    .where('franchiseId', '==', franchiseId)
    .orderBy('earnedAt', 'desc')
    .limit(1)
    .get();

  const lastRewardQuery = await db
    .collection('loyalty_rewards')
    .where('userId', '==', userId)
    .where('franchiseId', '==', franchiseId)
    .orderBy('generatedAt', 'desc')
    .limit(1)
    .get();

  const lastStampAt = !lastStampQuery.empty ? lastStampQuery.docs[0].data().earnedAt : null;
  const lastRewardAt = !lastRewardQuery.empty ? lastRewardQuery.docs[0].data().generatedAt : null;

  // Crear o actualizar summary
  if (!summaryDoc.exists) {
    const newSummary: LoyaltyCustomerSummary = {
      userId,
      franchises: {
        [franchiseId]: {
          activeStamps: currentStamps,
          totalStampsEarned: totalStamps.size,
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
      totalStampsEarned: totalStamps.size,
      totalRewardsRedeemed: rewardsByStatus.redeemed,
      updatedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    };
    await summaryRef.set(newSummary);
  } else {
    await summaryRef.update({
      [`franchises.${franchiseId}`]: {
        activeStamps: currentStamps,
        totalStampsEarned: totalStamps.size,
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

  // Validar estado
  if (reward.status !== 'generated' && reward.status !== 'active') {
    throw new HttpsError('failed-precondition', `Reward already ${reward.status}`);
  }

  // Validar expiración
  if (reward.expiresAt && reward.expiresAt.toMillis() < Date.now()) {
    await rewardDoc.ref.update({
      status: 'expired',
      expiredAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    throw new HttpsError('failed-precondition', 'Reward has expired');
  }

  // Marcar premio como "en uso" (prevenir doble redención)
  await rewardDoc.ref.update({
    status: 'in_use',
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

// ========================================
// Callable: Aplicar premio a turno
// ========================================

export const applyRewardToQueue = onCall({ region: config.region }, async (request) => {
  // Autenticación requerida
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { rewardId, queueId, branchId } = request.data;
  const barberId = request.auth.uid;

  // Validar input
  if (!rewardId || !queueId || !branchId) {
    throw new HttpsError('invalid-argument', 'rewardId, queueId, and branchId are required');
  }

  // Obtener premio
  const rewardDoc = await db.collection('loyalty_rewards').doc(rewardId).get();
  if (!rewardDoc.exists) {
    throw new HttpsError('not-found', 'Reward not found');
  }

  const reward = rewardDoc.data() as LoyaltyReward;

  // Validar estado
  if (reward.status !== 'in_use') {
    throw new HttpsError('failed-precondition', 'Reward must be in_use to apply');
  }

  // Obtener ticket
  const queueDoc = await db.collection('queues').doc(queueId).get();
  if (!queueDoc.exists) {
    throw new HttpsError('not-found', 'Queue ticket not found');
  }

  const ticket = queueDoc.data() as QueueTicket;

  // Validar que el usuario del premio coincide con el del ticket
  if (reward.userId !== ticket.userId) {
    throw new HttpsError('permission-denied', 'Reward does not belong to this user');
  }

  // Marcar premio como redimido y actualizar ticket
  const batch = db.batch();

  batch.update(rewardDoc.ref, {
    status: 'redeemed',
    redeemedAt: FieldValue.serverTimestamp(),
    redeemedBy: barberId,
    redeemedAtBranch: branchId,
    queueId,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Actualizar ticket con información del premio
  batch.update(queueDoc.ref, {
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

  await batch.commit();

  // Actualizar summary
  await updateCustomerSummary(reward.userId, reward.franchiseId);

  return {
    success: true,
    message: 'Reward applied successfully',
  };
});

// ========================================
// Scheduled: Expirar sellos vencidos
// ========================================

export const expireStampsDaily = onSchedule({
  schedule: '0 2 * * *',
  timeZone: 'Europe/Madrid',
  region: config.region,
}, async () => {
  const now = Timestamp.now();

  // Buscar sellos expirados
  const expiredStamps = await db
    .collection('loyalty_stamps')
    .where('status', '==', 'active')
    .where('expiresAt', '<=', now)
    .get();

  if (expiredStamps.empty) {
    logger.info('No stamps to expire');
    return;
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
}, async () => {
  const now = Timestamp.now();

  // Buscar premios expirados
  const expiredRewards = await db
    .collection('loyalty_rewards')
    .where('status', 'in', ['generated', 'active'])
    .where('expiresAt', '<=', now)
    .get();

  if (expiredRewards.empty) {
    logger.info('No rewards to expire');
    return;
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
