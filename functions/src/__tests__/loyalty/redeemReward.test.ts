import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as admin from 'firebase-admin';
import * as testUtils from 'firebase-functions-test';
import { HttpsError } from 'firebase-functions/v2/https';

vi.mock('../../config', () => ({
  config: { region: 'europe-west1' }
}));

const test = testUtils();

describe('redeemReward - Reward Redemption Callable', () => {
  let firestoreStub: any;
  let transactionStub: any;

  beforeEach(() => {
    firestoreStub = {
      collection: vi.fn().mockReturnThis(),
      doc: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn(),
      runTransaction: vi.fn(),
    };

    transactionStub = {
      get: vi.fn(),
      update: vi.fn(),
    };

    vi.spyOn(admin, 'firestore').mockReturnValue(firestoreStub as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should redeem reward successfully when status is generated', async () => {
    const rewardData = {
      rewardId: 'reward123',
      code: 'RWD-ABC123',
      status: 'generated',
      userId: 'user123',
      franchiseId: 'franchise1',
      serviceId: 'haircut',
      value: 2000,
      expiresAt: { toMillis: () => Date.now() + 86400000 }, // Tomorrow
    };

    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get.mockResolvedValueOnce({
        empty: false,
        docs: [{ data: () => rewardData, ref: {} }],
      });
      return callback(transactionStub);
    });

    const { redeemReward } = await import('../../loyalty');

    const request = {
      auth: { uid: 'user123' },
      data: { rewardCode: 'RWD-ABC123' },
    };

    const result = await (redeemReward as any)(request);

    expect(result.success).toBe(true);
    expect(result.reward).toMatchObject({
      rewardId: 'reward123',
      code: 'RWD-ABC123',
      userId: 'user123',
    });
    expect(transactionStub.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'in_use' })
    );
  });

  it('should redeem reward successfully when status is active', async () => {
    const rewardData = {
      rewardId: 'reward123',
      code: 'RWD-ABC123',
      status: 'active',
      userId: 'user123',
      franchiseId: 'franchise1',
      serviceId: 'haircut',
      value: 2000,
      expiresAt: { toMillis: () => Date.now() + 86400000 },
    };

    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get.mockResolvedValueOnce({
        empty: false,
        docs: [{ data: () => rewardData, ref: {} }],
      });
      return callback(transactionStub);
    });

    const { redeemReward } = await import('../../loyalty');

    const request = {
      auth: { uid: 'user123' },
      data: { rewardCode: 'RWD-ABC123' },
    };

    const result = await (redeemReward as any)(request);

    expect(result.success).toBe(true);
    expect(transactionStub.update).toHaveBeenCalled();
  });

  it('should use transaction to prevent double redemption', async () => {
    const rewardData = {
      status: 'redeemed', // Already redeemed
      userId: 'user123',
      franchiseId: 'franchise1',
    };

    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get.mockResolvedValueOnce({
        empty: false,
        docs: [{ data: () => rewardData, ref: {} }],
      });
      return callback(transactionStub);
    });

    const { redeemReward } = await import('../../loyalty');

    const request = {
      auth: { uid: 'user123' },
      data: { rewardCode: 'RWD-ABC123' },
    };

    await expect((redeemReward as any)(request)).rejects.toThrow(HttpsError);
    expect(transactionStub.update).not.toHaveBeenCalled();
  });

  it('should validate expiration date', async () => {
    const rewardData = {
      rewardId: 'reward123',
      status: 'generated',
      userId: 'user123',
      franchiseId: 'franchise1',
      expiresAt: { toMillis: () => Date.now() - 86400000 }, // Yesterday (expired)
    };

    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get.mockResolvedValueOnce({
        empty: false,
        docs: [{ data: () => rewardData, ref: {} }],
      });
      return callback(transactionStub);
    });

    const { redeemReward } = await import('../../loyalty');

    const request = {
      auth: { uid: 'user123' },
      data: { rewardCode: 'RWD-ABC123' },
    };

    await expect((redeemReward as any)(request)).rejects.toThrow(HttpsError);
    // Should mark as expired
    expect(transactionStub.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'expired' })
    );
  });

  it('should reject already redeemed rewards', async () => {
    const rewardData = {
      status: 'redeemed',
      userId: 'user123',
    };

    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get.mockResolvedValueOnce({
        empty: false,
        docs: [{ data: () => rewardData, ref: {} }],
      });
      return callback(transactionStub);
    });

    const { redeemReward } = await import('../../loyalty');

    const request = {
      auth: { uid: 'user123' },
      data: { rewardCode: 'RWD-ABC123' },
    };

    await expect((redeemReward as any)(request)).rejects.toThrow(HttpsError);
  });

  it('should require authentication', async () => {
    const { redeemReward } = await import('../../loyalty');

    const request = {
      auth: null, // Not authenticated
      data: { rewardCode: 'RWD-ABC123' },
    };

    await expect((redeemReward as any)(request)).rejects.toThrow(
      expect.objectContaining({ code: 'unauthenticated' })
    );
  });

  it('should validate required input', async () => {
    const { redeemReward } = await import('../../loyalty');

    const request = {
      auth: { uid: 'user123' },
      data: {}, // Missing rewardCode
    };

    await expect((redeemReward as any)(request)).rejects.toThrow(
      expect.objectContaining({ code: 'invalid-argument' })
    );
  });

  it('should handle reward not found', async () => {
    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get.mockResolvedValueOnce({
        empty: true,
        docs: [],
      });
      return callback(transactionStub);
    });

    const { redeemReward } = await import('../../loyalty');

    const request = {
      auth: { uid: 'user123' },
      data: { rewardCode: 'INVALID' },
    };

    await expect((redeemReward as any)(request)).rejects.toThrow(
      expect.objectContaining({ code: 'not-found' })
    );
  });

  it('should handle concurrent redemption attempts (race condition)', async () => {
    // First call succeeds
    const rewardData1 = {
      status: 'generated',
      userId: 'user123',
      franchiseId: 'franchise1',
      serviceId: 'haircut',
      value: 2000,
      expiresAt: { toMillis: () => Date.now() + 86400000 },
    };

    // Second call sees it as in_use
    const rewardData2 = {
      ...rewardData1,
      status: 'in_use',
    };

    let callCount = 0;
    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      callCount++;
      if (callCount === 1) {
        transactionStub.get.mockResolvedValueOnce({
          empty: false,
          docs: [{ data: () => rewardData1, ref: {} }],
        });
      } else {
        transactionStub.get.mockResolvedValueOnce({
          empty: false,
          docs: [{ data: () => rewardData2, ref: {} }],
        });
      }
      return callback(transactionStub);
    });

    const { redeemReward } = await import('../../loyalty');

    const request1 = {
      auth: { uid: 'user123' },
      data: { rewardCode: 'RWD-ABC123' },
    };

    const request2 = {
      auth: { uid: 'user123' },
      data: { rewardCode: 'RWD-ABC123' },
    };

    // First should succeed
    const result1 = await (redeemReward as any)(request1);
    expect(result1.success).toBe(true);

    // Second should fail
    await expect((redeemReward as any)(request2)).rejects.toThrow(HttpsError);
  });

  it('should return correct data structure', async () => {
    const rewardData = {
      rewardId: 'reward123',
      code: 'RWD-ABC123',
      status: 'generated',
      userId: 'user123',
      franchiseId: 'franchise1',
      serviceId: 'haircut',
      value: 2000,
      expiresAt: { toMillis: () => 1234567890 },
    };

    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get.mockResolvedValueOnce({
        empty: false,
        docs: [{ data: () => rewardData, ref: {} }],
      });
      return callback(transactionStub);
    });

    const { redeemReward } = await import('../../loyalty');

    const request = {
      auth: { uid: 'user123' },
      data: { rewardCode: 'RWD-ABC123' },
    };

    const result = await (redeemReward as any)(request);

    expect(result).toMatchObject({
      success: true,
      reward: {
        rewardId: 'reward123',
        code: 'RWD-ABC123',
        userId: 'user123',
        franchiseId: 'franchise1',
        serviceId: 'haircut',
        value: 2000,
        expiresAt: 1234567890,
      },
    });
  });

  it('should handle rewards without expiration', async () => {
    const rewardData = {
      rewardId: 'reward123',
      code: 'RWD-ABC123',
      status: 'generated',
      userId: 'user123',
      franchiseId: 'franchise1',
      serviceId: 'haircut',
      value: 2000,
      expiresAt: null, // No expiration
    };

    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get.mockResolvedValueOnce({
        empty: false,
        docs: [{ data: () => rewardData, ref: {} }],
      });
      return callback(transactionStub);
    });

    const { redeemReward } = await import('../../loyalty');

    const request = {
      auth: { uid: 'user123' },
      data: { rewardCode: 'RWD-ABC123' },
    };

    const result = await (redeemReward as any)(request);

    expect(result.success).toBe(true);
    expect(result.reward.expiresAt).toBeNull();
  });
});
