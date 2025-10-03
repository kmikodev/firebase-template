import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as admin from 'firebase-admin';
import * as testUtils from 'firebase-functions-test';
import { HttpsError } from 'firebase-functions/v2/https';

vi.mock('../../config', () => ({
  config: { region: 'europe-west1' }
}));

const test = testUtils();

describe('applyRewardToQueue - Apply Reward to Queue Ticket', () => {
  let firestoreStub: any;
  let transactionStub: any;

  beforeEach(() => {
    firestoreStub = {
      collection: vi.fn().mockReturnThis(),
      doc: vi.fn().mockReturnThis(),
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

  it('should validate barber role (barber only)', async () => {
    const barberData = {
      branchId: 'branch1',
    };

    firestoreStub.get.mockResolvedValueOnce({
      exists: true,
      data: () => barberData,
    });

    const rewardData = {
      status: 'in_use',
      userId: 'user123',
      franchiseId: 'franchise1',
    };

    const ticketData = {
      userId: 'user123',
      franchiseId: 'franchise1',
      branchId: 'branch1',
    };

    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get
        .mockResolvedValueOnce({ exists: true, data: () => rewardData, ref: {} })
        .mockResolvedValueOnce({ exists: true, data: () => ticketData, ref: {} });
      return callback(transactionStub);
    });

    const { applyRewardToQueue } = await import('../../loyalty');

    const request = {
      auth: {
        uid: 'barber1',
        token: { role: 'barber' },
      },
      data: {
        rewardId: 'reward123',
        queueId: 'queue123',
        branchId: 'branch1',
      },
    };

    const result = await (applyRewardToQueue as any)(request);

    expect(result.success).toBe(true);
    expect(transactionStub.update).toHaveBeenCalledTimes(2);
  });

  it('should validate admin role can apply rewards', async () => {
    const rewardData = {
      status: 'in_use',
      userId: 'user123',
      franchiseId: 'franchise1',
    };

    const ticketData = {
      userId: 'user123',
      franchiseId: 'franchise1',
      branchId: 'branch1',
    };

    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get
        .mockResolvedValueOnce({ exists: true, data: () => rewardData, ref: {} })
        .mockResolvedValueOnce({ exists: true, data: () => ticketData, ref: {} });
      return callback(transactionStub);
    });

    const { applyRewardToQueue } = await import('../../loyalty');

    const request = {
      auth: {
        uid: 'admin1',
        token: { role: 'admin' },
      },
      data: {
        rewardId: 'reward123',
        queueId: 'queue123',
        branchId: 'branch1',
      },
    };

    const result = await (applyRewardToQueue as any)(request);

    expect(result.success).toBe(true);
  });

  it('should validate super_admin role can apply rewards', async () => {
    const rewardData = {
      status: 'in_use',
      userId: 'user123',
      franchiseId: 'franchise1',
    };

    const ticketData = {
      userId: 'user123',
      franchiseId: 'franchise1',
      branchId: 'branch1',
    };

    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get
        .mockResolvedValueOnce({ exists: true, data: () => rewardData, ref: {} })
        .mockResolvedValueOnce({ exists: true, data: () => ticketData, ref: {} });
      return callback(transactionStub);
    });

    const { applyRewardToQueue } = await import('../../loyalty');

    const request = {
      auth: {
        uid: 'superadmin1',
        token: { role: 'super_admin' },
      },
      data: {
        rewardId: 'reward123',
        queueId: 'queue123',
        branchId: 'branch1',
      },
    };

    const result = await (applyRewardToQueue as any)(request);

    expect(result.success).toBe(true);
  });

  it('should reject client role', async () => {
    const { applyRewardToQueue } = await import('../../loyalty');

    const request = {
      auth: {
        uid: 'client1',
        token: { role: 'client' },
      },
      data: {
        rewardId: 'reward123',
        queueId: 'queue123',
        branchId: 'branch1',
      },
    };

    await expect((applyRewardToQueue as any)(request)).rejects.toThrow(
      expect.objectContaining({ code: 'permission-denied' })
    );
  });

  it('should validate barber branchId matches ticket branchId', async () => {
    const barberData = {
      branchId: 'branch2', // Different branch
    };

    firestoreStub.get.mockResolvedValueOnce({
      exists: true,
      data: () => barberData,
    });

    const { applyRewardToQueue } = await import('../../loyalty');

    const request = {
      auth: {
        uid: 'barber1',
        token: { role: 'barber' },
      },
      data: {
        rewardId: 'reward123',
        queueId: 'queue123',
        branchId: 'branch1', // Doesn't match barber's branch
      },
    };

    await expect((applyRewardToQueue as any)(request)).rejects.toThrow(
      expect.objectContaining({ code: 'permission-denied' })
    );
  });

  it('should validate franchiseId match between reward and ticket', async () => {
    const barberData = {
      branchId: 'branch1',
    };

    firestoreStub.get.mockResolvedValueOnce({
      exists: true,
      data: () => barberData,
    });

    const rewardData = {
      status: 'in_use',
      userId: 'user123',
      franchiseId: 'franchise1',
    };

    const ticketData = {
      userId: 'user123',
      franchiseId: 'franchise2', // Different franchise!
      branchId: 'branch1',
    };

    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get
        .mockResolvedValueOnce({ exists: true, data: () => rewardData, ref: {} })
        .mockResolvedValueOnce({ exists: true, data: () => ticketData, ref: {} });
      return callback(transactionStub);
    });

    const { applyRewardToQueue } = await import('../../loyalty');

    const request = {
      auth: {
        uid: 'barber1',
        token: { role: 'barber' },
      },
      data: {
        rewardId: 'reward123',
        queueId: 'queue123',
        branchId: 'branch1',
      },
    };

    await expect((applyRewardToQueue as any)(request)).rejects.toThrow(
      expect.objectContaining({ code: 'permission-denied' })
    );
  });

  it('should prevent applying reward to ticket that already has one', async () => {
    const barberData = {
      branchId: 'branch1',
    };

    firestoreStub.get.mockResolvedValueOnce({
      exists: true,
      data: () => barberData,
    });

    const rewardData = {
      status: 'in_use',
      userId: 'user123',
      franchiseId: 'franchise1',
    };

    const ticketData = {
      userId: 'user123',
      franchiseId: 'franchise1',
      branchId: 'branch1',
      loyaltyReward: {
        // Already has reward
        rewardId: 'existing-reward',
      },
    };

    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get
        .mockResolvedValueOnce({ exists: true, data: () => rewardData, ref: {} })
        .mockResolvedValueOnce({ exists: true, data: () => ticketData, ref: {} });
      return callback(transactionStub);
    });

    const { applyRewardToQueue } = await import('../../loyalty');

    const request = {
      auth: {
        uid: 'barber1',
        token: { role: 'barber' },
      },
      data: {
        rewardId: 'reward123',
        queueId: 'queue123',
        branchId: 'branch1',
      },
    };

    await expect((applyRewardToQueue as any)(request)).rejects.toThrow(
      expect.objectContaining({ code: 'failed-precondition' })
    );
  });

  it('should use transaction for atomicity', async () => {
    const barberData = {
      branchId: 'branch1',
    };

    firestoreStub.get.mockResolvedValueOnce({
      exists: true,
      data: () => barberData,
    });

    const rewardData = {
      rewardId: 'reward123',
      code: 'RWD-ABC123',
      status: 'in_use',
      userId: 'user123',
      franchiseId: 'franchise1',
      value: 2000,
    };

    const ticketData = {
      userId: 'user123',
      franchiseId: 'franchise1',
      branchId: 'branch1',
    };

    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get
        .mockResolvedValueOnce({ exists: true, data: () => rewardData, ref: {} })
        .mockResolvedValueOnce({ exists: true, data: () => ticketData, ref: {} });
      return callback(transactionStub);
    });

    const { applyRewardToQueue } = await import('../../loyalty');

    const request = {
      auth: {
        uid: 'barber1',
        token: { role: 'barber' },
      },
      data: {
        rewardId: 'reward123',
        queueId: 'queue123',
        branchId: 'branch1',
      },
    };

    await (applyRewardToQueue as any)(request);

    // Should update both reward and ticket atomically
    expect(transactionStub.update).toHaveBeenCalledTimes(2);
    expect(transactionStub.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'redeemed' })
    );
    expect(transactionStub.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        loyaltyReward: expect.objectContaining({
          rewardId: 'reward123',
          code: 'RWD-ABC123',
        }),
      })
    );
  });

  it('should mark reward as redeemed and ticket with loyaltyReward data', async () => {
    const barberData = {
      branchId: 'branch1',
    };

    firestoreStub.get.mockResolvedValueOnce({
      exists: true,
      data: () => barberData,
    });

    const rewardData = {
      rewardId: 'reward123',
      code: 'RWD-ABC123',
      status: 'in_use',
      userId: 'user123',
      franchiseId: 'franchise1',
      value: 2000,
    };

    const ticketData = {
      userId: 'user123',
      franchiseId: 'franchise1',
      branchId: 'branch1',
    };

    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get
        .mockResolvedValueOnce({ exists: true, data: () => rewardData, ref: {} })
        .mockResolvedValueOnce({ exists: true, data: () => ticketData, ref: {} });
      return callback(transactionStub);
    });

    const { applyRewardToQueue } = await import('../../loyalty');

    const request = {
      auth: {
        uid: 'barber1',
        token: { role: 'barber' },
      },
      data: {
        rewardId: 'reward123',
        queueId: 'queue123',
        branchId: 'branch1',
      },
    };

    await (applyRewardToQueue as any)(request);

    // Check reward update
    expect(transactionStub.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: 'redeemed',
        redeemedBy: 'barber1',
        redeemedAtBranch: 'branch1',
        queueId: 'queue123',
      })
    );

    // Check ticket update
    expect(transactionStub.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        loyaltyReward: expect.objectContaining({
          rewardId: 'reward123',
          code: 'RWD-ABC123',
          appliedBy: 'barber1',
          discountAmount: 2000,
          originalPrice: 2000,
          finalPrice: 0,
        }),
      })
    );
  });

  it('should handle admin/super_admin permissions (no branch check)', async () => {
    // Admin can apply rewards to any branch (no barber doc check)
    const rewardData = {
      status: 'in_use',
      userId: 'user123',
      franchiseId: 'franchise1',
    };

    const ticketData = {
      userId: 'user123',
      franchiseId: 'franchise1',
      branchId: 'branch1',
    };

    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get
        .mockResolvedValueOnce({ exists: true, data: () => rewardData, ref: {} })
        .mockResolvedValueOnce({ exists: true, data: () => ticketData, ref: {} });
      return callback(transactionStub);
    });

    const { applyRewardToQueue } = await import('../../loyalty');

    const request = {
      auth: {
        uid: 'admin1',
        token: { role: 'admin' },
      },
      data: {
        rewardId: 'reward123',
        queueId: 'queue123',
        branchId: 'branch1',
      },
    };

    const result = await (applyRewardToQueue as any)(request);

    expect(result.success).toBe(true);
    // Should NOT check barber document for admin/super_admin
    expect(firestoreStub.collection).not.toHaveBeenCalledWith('barbers');
  });

  it('should require authentication', async () => {
    const { applyRewardToQueue } = await import('../../loyalty');

    const request = {
      auth: null,
      data: {
        rewardId: 'reward123',
        queueId: 'queue123',
        branchId: 'branch1',
      },
    };

    await expect((applyRewardToQueue as any)(request)).rejects.toThrow(
      expect.objectContaining({ code: 'unauthenticated' })
    );
  });

  it('should validate required inputs', async () => {
    const { applyRewardToQueue } = await import('../../loyalty');

    const request = {
      auth: {
        uid: 'barber1',
        token: { role: 'barber' },
      },
      data: {
        // Missing rewardId
        queueId: 'queue123',
        branchId: 'branch1',
      },
    };

    await expect((applyRewardToQueue as any)(request)).rejects.toThrow(
      expect.objectContaining({ code: 'invalid-argument' })
    );
  });

  it('should validate reward status is in_use', async () => {
    const barberData = {
      branchId: 'branch1',
    };

    firestoreStub.get.mockResolvedValueOnce({
      exists: true,
      data: () => barberData,
    });

    const rewardData = {
      status: 'generated', // Wrong status, should be in_use
      userId: 'user123',
      franchiseId: 'franchise1',
    };

    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get.mockResolvedValueOnce({
        exists: true,
        data: () => rewardData,
        ref: {},
      });
      return callback(transactionStub);
    });

    const { applyRewardToQueue } = await import('../../loyalty');

    const request = {
      auth: {
        uid: 'barber1',
        token: { role: 'barber' },
      },
      data: {
        rewardId: 'reward123',
        queueId: 'queue123',
        branchId: 'branch1',
      },
    };

    await expect((applyRewardToQueue as any)(request)).rejects.toThrow(
      expect.objectContaining({ code: 'failed-precondition' })
    );
  });

  it('should validate user ownership (userId match)', async () => {
    const barberData = {
      branchId: 'branch1',
    };

    firestoreStub.get.mockResolvedValueOnce({
      exists: true,
      data: () => barberData,
    });

    const rewardData = {
      status: 'in_use',
      userId: 'user123',
      franchiseId: 'franchise1',
    };

    const ticketData = {
      userId: 'user999', // Different user!
      franchiseId: 'franchise1',
      branchId: 'branch1',
    };

    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get
        .mockResolvedValueOnce({ exists: true, data: () => rewardData, ref: {} })
        .mockResolvedValueOnce({ exists: true, data: () => ticketData, ref: {} });
      return callback(transactionStub);
    });

    const { applyRewardToQueue } = await import('../../loyalty');

    const request = {
      auth: {
        uid: 'barber1',
        token: { role: 'barber' },
      },
      data: {
        rewardId: 'reward123',
        queueId: 'queue123',
        branchId: 'branch1',
      },
    };

    await expect((applyRewardToQueue as any)(request)).rejects.toThrow(
      expect.objectContaining({ code: 'permission-denied' })
    );
  });
});
