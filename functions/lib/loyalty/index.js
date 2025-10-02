"use strict";
/**
 * Loyalty Card System - Cloud Functions
 * Sistema de tarjetas de fidelización con sellos
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireRewardsDaily = exports.expireStampsDaily = exports.applyRewardToQueue = exports.redeemReward = exports.onQueueCompleted = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
const config_1 = require("../config");
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;
// ========================================
// Helper Functions
// ========================================
/**
 * Obtiene la configuración de loyalty para una franquicia
 */
async function getLoyaltyConfig(franchiseId) {
    const configDoc = await db.collection('loyalty_configs').doc(franchiseId).get();
    if (!configDoc.exists) {
        return null;
    }
    return Object.assign({ franchiseId }, configDoc.data());
}
/**
 * Genera un código único para un premio
 */
function generateRewardCode() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `RWD-${timestamp}-${random}`.toUpperCase();
}
/**
 * Calcula fecha de expiración para sellos
 */
function calculateStampExpiration(config) {
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
function calculateRewardExpiration(config) {
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
function isServiceEligible(config, serviceId) {
    if (config.eligibleServices.mode === 'all') {
        return true;
    }
    return config.eligibleServices.serviceIds.includes(serviceId);
}
// ========================================
// Trigger: Crear sello al completar turno
// ========================================
exports.onQueueCompleted = (0, firestore_1.onDocumentUpdated)({
    document: 'queues/{queueId}',
    region: config_1.config.region,
}, async (event) => {
    var _a, _b;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
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
    const stamp = {
        stampId,
        userId: ticket.userId,
        franchiseId: ticket.franchiseId,
        branchId: ticket.branchId,
        earnedAt: Timestamp.now(),
        expiresAt: calculateStampExpiration(config),
        status: 'active',
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
async function checkAndGenerateReward(userId, franchiseId, config) {
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
async function generateReward(userId, franchiseId, config, stampDocs) {
    var _a;
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
    const servicePrice = serviceDoc.exists ? ((_a = serviceDoc.data()) === null || _a === void 0 ? void 0 : _a.price) || 0 : 0;
    // Crear premio
    const rewardId = db.collection('loyalty_rewards').doc().id;
    const reward = {
        rewardId,
        userId,
        franchiseId,
        code: generateRewardCode(),
        status: 'generated',
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
async function updateCustomerSummary(userId, franchiseId) {
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
    const activeRewardIds = [];
    allRewards.forEach(doc => {
        const reward = doc.data();
        if (reward.status === 'generated' || reward.status === 'active') {
            rewardsByStatus.generated++;
            activeRewardIds.push(reward.rewardId);
        }
        else if (reward.status === 'redeemed') {
            rewardsByStatus.redeemed++;
        }
        else if (reward.status === 'expired') {
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
        const newSummary = {
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
    }
    else {
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
            totalStampsEarned: FieldValue.increment(0),
            updatedAt: FieldValue.serverTimestamp(),
        });
    }
}
// ========================================
// Callable: Canjear premio
// ========================================
exports.redeemReward = (0, https_1.onCall)({ region: config_1.config.region }, async (request) => {
    var _a;
    // Autenticación requerida
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { rewardCode } = request.data;
    // Validar input
    if (!rewardCode) {
        throw new https_1.HttpsError('invalid-argument', 'rewardCode is required');
    }
    // Buscar premio por código
    const rewardQuery = await db
        .collection('loyalty_rewards')
        .where('code', '==', rewardCode.toUpperCase())
        .limit(1)
        .get();
    if (rewardQuery.empty) {
        throw new https_1.HttpsError('not-found', 'Reward not found');
    }
    const rewardDoc = rewardQuery.docs[0];
    const reward = rewardDoc.data();
    // Validar estado
    if (reward.status !== 'generated' && reward.status !== 'active') {
        throw new https_1.HttpsError('failed-precondition', `Reward already ${reward.status}`);
    }
    // Validar expiración
    if (reward.expiresAt && reward.expiresAt.toMillis() < Date.now()) {
        await rewardDoc.ref.update({
            status: 'expired',
            expiredAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        throw new https_1.HttpsError('failed-precondition', 'Reward has expired');
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
            expiresAt: ((_a = reward.expiresAt) === null || _a === void 0 ? void 0 : _a.toMillis()) || null,
        },
    };
});
// ========================================
// Callable: Aplicar premio a turno
// ========================================
exports.applyRewardToQueue = (0, https_1.onCall)({ region: config_1.config.region }, async (request) => {
    // Autenticación requerida
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { rewardId, queueId, branchId } = request.data;
    const barberId = request.auth.uid;
    // Validar input
    if (!rewardId || !queueId || !branchId) {
        throw new https_1.HttpsError('invalid-argument', 'rewardId, queueId, and branchId are required');
    }
    // Obtener premio
    const rewardDoc = await db.collection('loyalty_rewards').doc(rewardId).get();
    if (!rewardDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Reward not found');
    }
    const reward = rewardDoc.data();
    // Validar estado
    if (reward.status !== 'in_use') {
        throw new https_1.HttpsError('failed-precondition', 'Reward must be in_use to apply');
    }
    // Obtener ticket
    const queueDoc = await db.collection('queues').doc(queueId).get();
    if (!queueDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Queue ticket not found');
    }
    const ticket = queueDoc.data();
    // Validar que el usuario del premio coincide con el del ticket
    if (reward.userId !== ticket.userId) {
        throw new https_1.HttpsError('permission-denied', 'Reward does not belong to this user');
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
exports.expireStampsDaily = (0, scheduler_1.onSchedule)({
    schedule: '0 2 * * *',
    timeZone: 'Europe/Madrid',
    region: config_1.config.region,
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
    const batches = [];
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
    const affectedUsers = new Set(expiredStamps.docs.map(doc => doc.data().userId));
    const affectedFranchises = new Set(expiredStamps.docs.map(doc => doc.data().franchiseId));
    for (const userId of affectedUsers) {
        for (const franchiseId of affectedFranchises) {
            await updateCustomerSummary(userId, franchiseId);
        }
    }
});
// ========================================
// Scheduled: Expirar premios vencidos
// ========================================
exports.expireRewardsDaily = (0, scheduler_1.onSchedule)({
    schedule: '0 3 * * *',
    timeZone: 'Europe/Madrid',
    region: config_1.config.region,
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
    const affectedUsers = new Set(expiredRewards.docs.map(doc => doc.data().userId));
    const affectedFranchises = new Set(expiredRewards.docs.map(doc => doc.data().franchiseId));
    for (const userId of affectedUsers) {
        for (const franchiseId of affectedFranchises) {
            await updateCustomerSummary(userId, franchiseId);
        }
    }
});
// ========================================
// Helper: Enviar notificaciones
// ========================================
async function sendRewardGeneratedNotification(userId, reward) {
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
//# sourceMappingURL=index.js.map