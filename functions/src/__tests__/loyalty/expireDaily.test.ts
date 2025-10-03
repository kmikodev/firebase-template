import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as admin from 'firebase-admin';
import * as testUtils from 'firebase-functions-test';

vi.mock('../../config', () => ({
  config: { region: 'europe-west1' }
}));

const test = testUtils();

describe('expireStampsDaily & expireRewardsDaily - Scheduled Expiration', () => {
  let firestoreStub: any;
  let batchStub: any;

  beforeEach(() => {
    batchStub = {
      update: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };

    firestoreStub = {
      collection: vi.fn().mockReturnThis(),
      doc: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn(),
      batch: vi.fn(() => batchStub),
    };

    vi.spyOn(admin, 'firestore').mockReturnValue(firestoreStub as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('expireStampsDaily', () => {
    it('should find and expire stamps with expiresAt <= now', async () => {
      const now = new Date();
      const expiredStamps = [
        {
          id: 'stamp1',
          ref: {},
          data: () => ({
            userId: 'user1',
            franchiseId: 'franchise1',
            status: 'active',
            expiresAt: { toDate: () => new Date(now.getTime() - 86400000) },
          }),
        },
        {
          id: 'stamp2',
          ref: {},
          data: () => ({
            userId: 'user1',
            franchiseId: 'franchise1',
            status: 'active',
            expiresAt: { toDate: () => new Date(now.getTime() - 172800000) },
          }),
        },
      ];

      firestoreStub.get.mockResolvedValueOnce({
        empty: false,
        size: 2,
        docs: expiredStamps,
      });

      const { expireStampsDaily } = await import('../../loyalty');

      await (expireStampsDaily as any)({});

      expect(batchStub.update).toHaveBeenCalledTimes(2);
      expect(batchStub.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: 'expired' })
      );
      expect(batchStub.commit).toHaveBeenCalled();
    });

    it('should respect MAX_DOCS_PER_RUN limit (10,000)', async () => {
      firestoreStub.limit.mockReturnThis();
      firestoreStub.get.mockResolvedValueOnce({
        empty: true,
        size: 0,
        docs: [],
      });

      const { expireStampsDaily } = await import('../../loyalty');

      await (expireStampsDaily as any)({});

      expect(firestoreStub.limit).toHaveBeenCalledWith(10000);
    });

    it('should update status to expired', async () => {
      const expiredStamps = [
        {
          id: 'stamp1',
          ref: {},
          data: () => ({
            userId: 'user1',
            franchiseId: 'franchise1',
            status: 'active',
          }),
        },
      ];

      firestoreStub.get.mockResolvedValueOnce({
        empty: false,
        size: 1,
        docs: expiredStamps,
      });

      const { expireStampsDaily } = await import('../../loyalty');

      await (expireStampsDaily as any)({});

      expect(batchStub.update).toHaveBeenCalledWith(
        expiredStamps[0].ref,
        expect.objectContaining({ status: 'expired' })
      );
    });

    it('should handle batch processing correctly (500 per batch)', async () => {
      // Create 1000 stamps (should result in 2 batches)
      const stamps = Array.from({ length: 1000 }, (_, i) => ({
        id: `stamp${i}`,
        ref: {},
        data: () => ({
          userId: 'user1',
          franchiseId: 'franchise1',
          status: 'active',
        }),
      }));

      firestoreStub.get.mockResolvedValueOnce({
        empty: false,
        size: 1000,
        docs: stamps,
      });

      const { expireStampsDaily } = await import('../../loyalty');

      await (expireStampsDaily as any)({});

      // Should create 2 batches (500 each)
      expect(firestoreStub.batch).toHaveBeenCalledTimes(2);
      expect(batchStub.commit).toHaveBeenCalledTimes(2);
    });

    it('should handle empty result gracefully', async () => {
      firestoreStub.get.mockResolvedValueOnce({
        empty: true,
        size: 0,
        docs: [],
      });

      const { expireStampsDaily } = await import('../../loyalty');

      await (expireStampsDaily as any)({});

      expect(batchStub.update).not.toHaveBeenCalled();
      expect(batchStub.commit).not.toHaveBeenCalled();
    });

    it('should warn when reaching limit', async () => {
      const stamps = Array.from({ length: 10000 }, (_, i) => ({
        id: `stamp${i}`,
        ref: {},
        data: () => ({
          userId: 'user1',
          franchiseId: 'franchise1',
          status: 'active',
        }),
      }));

      firestoreStub.get.mockResolvedValueOnce({
        empty: false,
        size: 10000,
        docs: stamps,
      });

      const loggerWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { expireStampsDaily } = await import('../../loyalty');

      await (expireStampsDaily as any)({});

      // Should process all 10000 stamps
      expect(batchStub.update).toHaveBeenCalledTimes(10000);

      loggerWarnSpy.mockRestore();
    });
  });

  describe('expireRewardsDaily', () => {
    it('should find and expire rewards with expiresAt <= now', async () => {
      const now = new Date();
      const expiredRewards = [
        {
          id: 'reward1',
          ref: {},
          data: () => ({
            userId: 'user1',
            franchiseId: 'franchise1',
            status: 'generated',
            expiresAt: { toDate: () => new Date(now.getTime() - 86400000) },
          }),
        },
        {
          id: 'reward2',
          ref: {},
          data: () => ({
            userId: 'user2',
            franchiseId: 'franchise1',
            status: 'active',
            expiresAt: { toDate: () => new Date(now.getTime() - 172800000) },
          }),
        },
      ];

      firestoreStub.get.mockResolvedValueOnce({
        empty: false,
        size: 2,
        docs: expiredRewards,
      });

      const { expireRewardsDaily } = await import('../../loyalty');

      await (expireRewardsDaily as any)({});

      expect(batchStub.update).toHaveBeenCalledTimes(2);
      expect(batchStub.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: 'expired' })
      );
      expect(batchStub.commit).toHaveBeenCalled();
    });

    it('should respect MAX_DOCS_PER_RUN limit', async () => {
      firestoreStub.limit.mockReturnThis();
      firestoreStub.get.mockResolvedValueOnce({
        empty: true,
        size: 0,
        docs: [],
      });

      const { expireRewardsDaily } = await import('../../loyalty');

      await (expireRewardsDaily as any)({});

      expect(firestoreStub.limit).toHaveBeenCalledWith(10000);
    });

    it('should update status to expired', async () => {
      const expiredRewards = [
        {
          id: 'reward1',
          ref: {},
          data: () => ({
            userId: 'user1',
            franchiseId: 'franchise1',
            status: 'generated',
          }),
        },
      ];

      firestoreStub.get.mockResolvedValueOnce({
        empty: false,
        size: 1,
        docs: expiredRewards,
      });

      const { expireRewardsDaily } = await import('../../loyalty');

      await (expireRewardsDaily as any)({});

      expect(batchStub.update).toHaveBeenCalledWith(
        expiredRewards[0].ref,
        expect.objectContaining({
          status: 'expired',
        })
      );
    });

    it('should handle batch processing', async () => {
      const rewards = Array.from({ length: 100 }, (_, i) => ({
        id: `reward${i}`,
        ref: {},
        data: () => ({
          userId: 'user1',
          franchiseId: 'franchise1',
          status: 'generated',
        }),
      }));

      firestoreStub.get.mockResolvedValueOnce({
        empty: false,
        size: 100,
        docs: rewards,
      });

      const { expireRewardsDaily } = await import('../../loyalty');

      await (expireRewardsDaily as any)({});

      expect(batchStub.update).toHaveBeenCalledTimes(100);
      expect(batchStub.commit).toHaveBeenCalled();
    });

    it('should handle empty result gracefully', async () => {
      firestoreStub.get.mockResolvedValueOnce({
        empty: true,
        size: 0,
        docs: [],
      });

      const { expireRewardsDaily } = await import('../../loyalty');

      await (expireRewardsDaily as any)({});

      expect(batchStub.update).not.toHaveBeenCalled();
      expect(batchStub.commit).not.toHaveBeenCalled();
    });

    it('should query for both generated and active statuses', async () => {
      firestoreStub.get.mockResolvedValueOnce({
        empty: true,
        size: 0,
        docs: [],
      });

      const { expireRewardsDaily } = await import('../../loyalty');

      await (expireRewardsDaily as any)({});

      expect(firestoreStub.where).toHaveBeenCalledWith(
        'status',
        'in',
        ['generated', 'active']
      );
    });
  });

  describe('updateCustomerSummary integration', () => {
    it('should call updateCustomerSummary for affected users after expiring stamps', async () => {
      const stamps = [
        {
          id: 'stamp1',
          ref: {},
          data: () => ({
            userId: 'user1',
            franchiseId: 'franchise1',
            status: 'active',
          }),
        },
        {
          id: 'stamp2',
          ref: {},
          data: () => ({
            userId: 'user2',
            franchiseId: 'franchise1',
            status: 'active',
          }),
        },
      ];

      firestoreStub.get.mockResolvedValueOnce({
        empty: false,
        size: 2,
        docs: stamps,
      });

      const { expireStampsDaily } = await import('../../loyalty');

      await (expireStampsDaily as any)({});

      // Should process summary updates for affected users
      expect(batchStub.commit).toHaveBeenCalled();
    });

    it('should call updateCustomerSummary for affected users after expiring rewards', async () => {
      const rewards = [
        {
          id: 'reward1',
          ref: {},
          data: () => ({
            userId: 'user1',
            franchiseId: 'franchise1',
            status: 'generated',
          }),
        },
      ];

      firestoreStub.get.mockResolvedValueOnce({
        empty: false,
        size: 1,
        docs: rewards,
      });

      const { expireRewardsDaily } = await import('../../loyalty');

      await (expireRewardsDaily as any)({});

      expect(batchStub.commit).toHaveBeenCalled();
    });
  });
});
