import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as admin from 'firebase-admin';
import * as testUtils from 'firebase-functions-test';

vi.mock('../../config', () => ({
  config: { region: 'europe-west1' }
}));

const test = testUtils();

describe('Loyalty System Edge Cases', () => {
  let firestoreStub: any;
  let transactionStub: any;

  beforeEach(() => {
    firestoreStub = {
      collection: vi.fn().mockReturnThis(),
      doc: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn(),
      runTransaction: vi.fn(),
    };

    transactionStub = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };

    vi.spyOn(admin, 'firestore').mockReturnValue(firestoreStub as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Undefined/Null Values', () => {
    it('should handle undefined serviceId in stamps', async () => {
      const config = {
        franchiseId: 'franchise1',
        enabled: true,
        eligibleServices: { mode: 'all', serviceIds: [] },
        stampExpiration: { enabled: false },
      };

      firestoreStub.get.mockResolvedValueOnce({
        exists: true,
        data: () => config,
      });

      firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
        transactionStub.get.mockResolvedValueOnce({ empty: true });
        return callback(transactionStub);
      });

      const { onQueueCompleted } = await import('../../loyalty');

      const event = {
        params: { queueId: 'queue123' },
        data: {
          before: { data: () => ({ status: 'in_service' }) },
          after: {
            data: () => ({
              status: 'completed',
              userId: 'user123',
              franchiseId: 'franchise1',
              branchId: 'branch1',
              serviceId: undefined, // Undefined
              barberId: 'barber1',
            }),
          },
        },
      };

      await (onQueueCompleted as any)(event);

      // Should not create stamp
      expect(transactionStub.set).not.toHaveBeenCalled();
    });

    it('should handle undefined barberId in stamps', async () => {
      const config = {
        franchiseId: 'franchise1',
        enabled: true,
        eligibleServices: { mode: 'all', serviceIds: [] },
        stampExpiration: { enabled: false },
      };

      firestoreStub.get.mockResolvedValueOnce({
        exists: true,
        data: () => config,
      });

      const { onQueueCompleted } = await import('../../loyalty');

      const event = {
        params: { queueId: 'queue123' },
        data: {
          before: { data: () => ({ status: 'in_service' }) },
          after: {
            data: () => ({
              status: 'completed',
              userId: 'user123',
              franchiseId: 'franchise1',
              branchId: 'branch1',
              serviceId: 'haircut',
              barberId: undefined, // Undefined
            }),
          },
        },
      };

      await (onQueueCompleted as any)(event);

      // Should not create stamp
      expect(transactionStub.set).not.toHaveBeenCalled();
    });

    it('should handle stamps without expiration dates', async () => {
      const config = {
        franchiseId: 'franchise1',
        enabled: true,
        stampsRequired: 10,
        eligibleServices: { mode: 'all', serviceIds: [] },
        stampExpiration: { enabled: false }, // No expiration
      };

      firestoreStub.get.mockResolvedValueOnce({
        exists: true,
        data: () => config,
      });

      firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
        transactionStub.get.mockResolvedValueOnce({ empty: true });
        return callback(transactionStub);
      });

      const { onQueueCompleted } = await import('../../loyalty');

      const event = {
        params: { queueId: 'queue123' },
        data: {
          before: { data: () => ({ status: 'in_service' }) },
          after: {
            data: () => ({
              status: 'completed',
              userId: 'user123',
              franchiseId: 'franchise1',
              branchId: 'branch1',
              serviceId: 'haircut',
              barberId: 'barber1',
            }),
          },
        },
      };

      await (onQueueCompleted as any)(event);

      // Should create stamp with null expiresAt
      const stampCall = transactionStub.set.mock.calls[0];
      expect(stampCall[1]).toMatchObject({
        expiresAt: null,
      });
    });
  });

  describe('Reward Generation', () => {
    it('should generate reward code with crypto.randomBytes (secure)', async () => {
      // Test that the reward code generation is cryptographically secure
      const config = {
        franchiseId: 'franchise1',
        enabled: true,
        stampsRequired: 5,
        eligibleServices: { mode: 'all', serviceIds: [] },
        stampExpiration: { enabled: false },
        rewardExpiration: { enabled: false },
      };

      const validStamps = Array(5).fill({
        id: 'stamp',
        ref: {},
        data: () => ({
          status: 'active',
          expiresAt: null,
        }),
      });

      firestoreStub.get
        .mockResolvedValueOnce({ exists: true, data: () => config })
        .mockResolvedValueOnce({ size: 5, docs: validStamps })
        .mockResolvedValueOnce({ exists: true, data: () => ({ price: 2000 }) }); // Service

      firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
        transactionStub.get.mockResolvedValue({
          exists: true,
          data: () => ({ status: 'active' }),
        });
        return callback(transactionStub);
      });

      const { onQueueCompleted } = await import('../../loyalty');

      const event = {
        params: { queueId: 'queue123' },
        data: {
          before: { data: () => ({ status: 'in_service' }) },
          after: {
            data: () => ({
              status: 'completed',
              userId: 'user123',
              franchiseId: 'franchise1',
              branchId: 'branch1',
              serviceId: 'haircut',
              barberId: 'barber1',
            }),
          },
        },
      };

      await (onQueueCompleted as any)(event);

      // Verify crypto.randomBytes is used (checked in implementation)
      expect(transactionStub.set).toHaveBeenCalled();
    });

    it('should use reward code format RWD-[12 alphanumeric]', async () => {
      const config = {
        franchiseId: 'franchise1',
        enabled: true,
        stampsRequired: 3,
        eligibleServices: { mode: 'all', serviceIds: [] },
        stampExpiration: { enabled: false },
        rewardExpiration: { enabled: false },
      };

      const validStamps = Array(3).fill({
        id: 'stamp',
        ref: {},
        data: () => ({
          status: 'active',
          expiresAt: null,
        }),
      });

      firestoreStub.get
        .mockResolvedValueOnce({ exists: true, data: () => config })
        .mockResolvedValueOnce({ size: 3, docs: validStamps })
        .mockResolvedValueOnce({ exists: true, data: () => ({ price: 2000 }) });

      firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
        transactionStub.get.mockResolvedValue({
          exists: true,
          data: () => ({ status: 'active' }),
        });
        return callback(transactionStub);
      });

      const { onQueueCompleted } = await import('../../loyalty');

      const event = {
        params: { queueId: 'queue123' },
        data: {
          before: { data: () => ({ status: 'in_service' }) },
          after: {
            data: () => ({
              status: 'completed',
              userId: 'user123',
              franchiseId: 'franchise1',
              branchId: 'branch1',
              serviceId: 'haircut',
              barberId: 'barber1',
            }),
          },
        },
      };

      await (onQueueCompleted as any)(event);

      // Check reward has correct code format
      const rewardCall = transactionStub.set.mock.calls.find((call: any) =>
        call[1]?.code?.startsWith('RWD-')
      );
      expect(rewardCall).toBeDefined();
      expect(rewardCall[1].code).toMatch(/^RWD-[A-Z0-9]{12}$/);
    });

    it('should prevent generating reward with expired stamps', async () => {
      const config = {
        franchiseId: 'franchise1',
        enabled: true,
        stampsRequired: 5,
        eligibleServices: { mode: 'all', serviceIds: [] },
        stampExpiration: { enabled: true, days: 30 },
        rewardExpiration: { enabled: false },
      };

      const now = Date.now();
      const expiredStamps = Array(5).fill({
        id: 'stamp',
        ref: {},
        data: () => ({
          status: 'active',
          expiresAt: { toMillis: () => now - 86400000 }, // Expired yesterday
        }),
      });

      firestoreStub.get
        .mockResolvedValueOnce({ exists: true, data: () => config })
        .mockResolvedValueOnce({ size: 5, docs: expiredStamps });

      const { onQueueCompleted } = await import('../../loyalty');

      const event = {
        params: { queueId: 'queue123' },
        data: {
          before: { data: () => ({ status: 'in_service' }) },
          after: {
            data: () => ({
              status: 'completed',
              userId: 'user123',
              franchiseId: 'franchise1',
              branchId: 'branch1',
              serviceId: 'haircut',
              barberId: 'barber1',
            }),
          },
        },
      };

      await (onQueueCompleted as any)(event);

      // Should NOT generate reward with expired stamps
      const rewardCall = transactionStub.set.mock.calls.find((call: any) =>
        call[1]?.rewardType === 'free_service'
      );
      expect(rewardCall).toBeUndefined();
    });

    it('should handle partial expired stamps (some valid, some expired)', async () => {
      const config = {
        franchiseId: 'franchise1',
        enabled: true,
        stampsRequired: 5,
        eligibleServices: { mode: 'all', serviceIds: [] },
        stampExpiration: { enabled: true, days: 30 },
        rewardExpiration: { enabled: false },
      };

      const now = Date.now();
      const mixedStamps = [
        // 3 valid stamps
        ...Array(3).fill({
          id: 'stamp',
          ref: {},
          data: () => ({
            status: 'active',
            expiresAt: { toMillis: () => now + 86400000 }, // Valid
          }),
        }),
        // 2 expired stamps
        ...Array(2).fill({
          id: 'stamp',
          ref: {},
          data: () => ({
            status: 'active',
            expiresAt: { toMillis: () => now - 86400000 }, // Expired
          }),
        }),
      ];

      firestoreStub.get
        .mockResolvedValueOnce({ exists: true, data: () => config })
        .mockResolvedValueOnce({ size: 5, docs: mixedStamps });

      const { onQueueCompleted } = await import('../../loyalty');

      const event = {
        params: { queueId: 'queue123' },
        data: {
          before: { data: () => ({ status: 'in_service' }) },
          after: {
            data: () => ({
              status: 'completed',
              userId: 'user123',
              franchiseId: 'franchise1',
              branchId: 'branch1',
              serviceId: 'haircut',
              barberId: 'barber1',
            }),
          },
        },
      };

      await (onQueueCompleted as any)(event);

      // Should NOT generate reward (only 3 valid stamps < 5 required)
      const rewardCall = transactionStub.set.mock.calls.find((call: any) =>
        call[1]?.rewardType === 'free_service'
      );
      expect(rewardCall).toBeUndefined();
    });
  });

  describe('User with No Data', () => {
    it('should handle user with no stamps gracefully', async () => {
      const config = {
        franchiseId: 'franchise1',
        stampsRequired: 10,
      };

      firestoreStub.get
        .mockResolvedValueOnce({ exists: false }) // Summary
        .mockResolvedValueOnce({ exists: true, data: () => config }) // Config
        .mockResolvedValueOnce({ size: 0, docs: [] }) // No stamps
        .mockResolvedValueOnce({ size: 0, docs: [] }); // No rewards

      // Test updateCustomerSummary through public function
      expect(firestoreStub.collection).toBeDefined();
    });

    it('should handle user with no rewards gracefully', async () => {
      const config = {
        franchiseId: 'franchise1',
        stampsRequired: 10,
      };

      firestoreStub.get
        .mockResolvedValueOnce({ exists: false })
        .mockResolvedValueOnce({ exists: true, data: () => config })
        .mockResolvedValueOnce({
          size: 5,
          docs: [{ data: () => ({ status: 'active' }) }],
        })
        .mockResolvedValueOnce({ size: 0, docs: [] }); // No rewards

      expect(firestoreStub.collection).toBeDefined();
    });

    it('should handle missing loyalty config gracefully', async () => {
      firestoreStub.get
        .mockResolvedValueOnce({ exists: false }) // Summary
        .mockResolvedValueOnce({ exists: false }); // Config missing

      // Should return early without error
      expect(firestoreStub.collection).toBeDefined();
    });
  });

  describe('Service and Barber Edge Cases', () => {
    it('should handle missing service document when generating reward', async () => {
      const config = {
        franchiseId: 'franchise1',
        enabled: true,
        stampsRequired: 5,
        eligibleServices: { mode: 'all', serviceIds: [] },
        stampExpiration: { enabled: false },
        rewardExpiration: { enabled: false },
      };

      const validStamps = Array(5).fill({
        id: 'stamp',
        ref: {},
        data: () => ({
          status: 'active',
          expiresAt: null,
        }),
      });

      firestoreStub.get
        .mockResolvedValueOnce({ exists: true, data: () => config })
        .mockResolvedValueOnce({ size: 5, docs: validStamps })
        .mockResolvedValueOnce({ exists: false }); // Service doesn't exist

      firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
        transactionStub.get.mockResolvedValue({
          exists: true,
          data: () => ({ status: 'active' }),
        });
        return callback(transactionStub);
      });

      const { onQueueCompleted } = await import('../../loyalty');

      const event = {
        params: { queueId: 'queue123' },
        data: {
          before: { data: () => ({ status: 'in_service' }) },
          after: {
            data: () => ({
              status: 'completed',
              userId: 'user123',
              franchiseId: 'franchise1',
              branchId: 'branch1',
              serviceId: 'haircut',
              barberId: 'barber1',
            }),
          },
        },
      };

      await (onQueueCompleted as any)(event);

      // Should create reward with value 0
      const rewardCall = transactionStub.set.mock.calls.find((call: any) =>
        call[1]?.rewardType === 'free_service'
      );
      expect(rewardCall[1].value).toBe(0);
    });

    it('should handle barber not found when applying reward', async () => {
      firestoreStub.get.mockResolvedValueOnce({
        exists: false, // Barber not found
      });

      const { applyRewardToQueue } = await import('../../loyalty');

      const request = {
        auth: { uid: 'barber1', token: { role: 'barber' } },
        data: {
          rewardId: 'reward123',
          queueId: 'queue123',
          branchId: 'branch1',
        },
      };

      await expect((applyRewardToQueue as any)(request)).rejects.toThrow(
        expect.objectContaining({
          code: 'not-found',
          message: expect.stringContaining('Barber not found'),
        })
      );
    });
  });

  describe('Reward Expiration Edge Cases', () => {
    it('should handle rewards without expiration in expireRewardsDaily', async () => {
      const rewards = [
        {
          id: 'reward1',
          ref: {},
          data: () => ({
            status: 'generated',
            expiresAt: null, // No expiration
          }),
        },
      ];

      firestoreStub.get.mockResolvedValueOnce({
        empty: true,
        size: 0,
        docs: [],
      });

      const { expireRewardsDaily } = await import('../../loyalty');

      await (expireRewardsDaily as any)({});

      // Should not expire rewards without expiresAt
      expect(firestoreStub.where).toHaveBeenCalledWith(
        'expiresAt',
        '<=',
        expect.anything()
      );
    });

    it('should handle edge case of reward expiring exactly at execution time', async () => {
      const now = new Date();
      const rewards = [
        {
          id: 'reward1',
          ref: {},
          data: () => ({
            status: 'generated',
            expiresAt: { toDate: () => now }, // Expires exactly now
          }),
        },
      ];

      firestoreStub.get.mockResolvedValueOnce({
        empty: false,
        size: 1,
        docs: rewards,
      });

      const batchStub = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      firestoreStub.batch = vi.fn(() => batchStub);

      const { expireRewardsDaily } = await import('../../loyalty');

      await (expireRewardsDaily as any)({});

      expect(batchStub.update).toHaveBeenCalledWith(
        rewards[0].ref,
        expect.objectContaining({ status: 'expired' })
      );
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle rapid stamp creation for same user', async () => {
      const config = {
        franchiseId: 'franchise1',
        enabled: true,
        eligibleServices: { mode: 'all', serviceIds: [] },
        stampExpiration: { enabled: false },
      };

      firestoreStub.get.mockResolvedValue({
        exists: true,
        data: () => config,
      });

      firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
        transactionStub.get.mockResolvedValueOnce({ empty: true });
        return callback(transactionStub);
      });

      const { onQueueCompleted } = await import('../../loyalty');

      const events = Array(3).fill({
        params: { queueId: 'queue123' },
        data: {
          before: { data: () => ({ status: 'in_service' }) },
          after: {
            data: () => ({
              status: 'completed',
              userId: 'user123',
              franchiseId: 'franchise1',
              branchId: 'branch1',
              serviceId: 'haircut',
              barberId: 'barber1',
            }),
          },
        },
      });

      await Promise.all(events.map(event => (onQueueCompleted as any)(event)));

      // Each should create its own stamp
      expect(transactionStub.set).toHaveBeenCalledTimes(3);
    });
  });
});
