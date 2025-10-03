import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getUserStamps,
  getUserRewards,
  redeemReward,
  applyRewardToQueue,
  subscribeToUserSummary,
} from '@/services/loyaltyService';

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
  functions: {},
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  Timestamp: {
    now: () => ({ toMillis: () => Date.now() }),
  },
}));

// Mock Cloud Functions
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
}));

describe('loyaltyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUserStamps', () => {
    it('should filter by userId and franchiseId', async () => {
      const { getDocs, query, where } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValue({
        docs: [
          {
            id: 'stamp1',
            data: () => ({
              userId: 'user123',
              franchiseId: 'franchise1',
              status: 'active',
            }),
          },
        ],
      });

      const stamps = await getUserStamps('user123', 'franchise1');

      expect(where).toHaveBeenCalledWith('userId', '==', 'user123');
      expect(where).toHaveBeenCalledWith('franchiseId', '==', 'franchise1');
      expect(where).toHaveBeenCalledWith('status', '==', 'active');
      expect(stamps).toHaveLength(1);
    });

    it('should order by earnedAt desc', async () => {
      const { getDocs, orderBy } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValue({ docs: [] });

      await getUserStamps('user123', 'franchise1');

      expect(orderBy).toHaveBeenCalledWith('earnedAt', 'desc');
    });
  });

  describe('getUserRewards', () => {
    it('should filter correctly with franchiseId', async () => {
      const { getDocs, where } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValue({
        docs: [
          {
            id: 'reward1',
            data: () => ({
              userId: 'user123',
              franchiseId: 'franchise1',
              status: 'generated',
            }),
          },
        ],
      });

      const rewards = await getUserRewards('user123', 'franchise1');

      expect(where).toHaveBeenCalledWith('userId', '==', 'user123');
      expect(where).toHaveBeenCalledWith('franchiseId', '==', 'franchise1');
      expect(where).toHaveBeenCalledWith('status', 'in', ['generated', 'active']);
      expect(rewards).toHaveLength(1);
    });

    it('should filter correctly without franchiseId', async () => {
      const { getDocs, where } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValue({
        docs: [
          {
            id: 'reward1',
            data: () => ({
              userId: 'user123',
              status: 'generated',
            }),
          },
        ],
      });

      const rewards = await getUserRewards('user123');

      expect(where).toHaveBeenCalledWith('userId', '==', 'user123');
      expect(where).toHaveBeenCalledWith('status', 'in', ['generated', 'active']);
      expect(rewards).toHaveLength(1);
    });
  });

  describe('redeemReward', () => {
    it('should call Cloud Function with correct params', async () => {
      const { httpsCallable } = await import('firebase/functions');
      const mockCallable = vi.fn().mockResolvedValue({
        data: {
          success: true,
          reward: {
            rewardId: 'reward123',
            code: 'RWD-ABC123',
          },
        },
      });

      (httpsCallable as any).mockReturnValue(mockCallable);

      const result = await redeemReward('RWD-ABC123');

      expect(httpsCallable).toHaveBeenCalledWith(
        expect.anything(),
        'redeemReward'
      );
      expect(mockCallable).toHaveBeenCalledWith({ rewardCode: 'RWD-ABC123' });
      expect(result.success).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const { httpsCallable } = await import('firebase/functions');
      const mockCallable = vi.fn().mockRejectedValue(new Error('Test error'));

      (httpsCallable as any).mockReturnValue(mockCallable);

      const result = await redeemReward('INVALID');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('applyRewardToQueue', () => {
    it('should call Cloud Function with correct params', async () => {
      const { httpsCallable } = await import('firebase/functions');
      const mockCallable = vi.fn().mockResolvedValue({
        data: {
          success: true,
          message: 'Reward applied successfully',
        },
      });

      (httpsCallable as any).mockReturnValue(mockCallable);

      const result = await applyRewardToQueue('reward123', 'queue123', 'branch1');

      expect(httpsCallable).toHaveBeenCalledWith(
        expect.anything(),
        'applyRewardToQueue'
      );
      expect(mockCallable).toHaveBeenCalledWith({
        rewardId: 'reward123',
        queueId: 'queue123',
        branchId: 'branch1',
      });
      expect(result.success).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const { httpsCallable } = await import('firebase/functions');
      const mockCallable = vi.fn().mockRejectedValue(new Error('Permission denied'));

      (httpsCallable as any).mockReturnValue(mockCallable);

      const result = await applyRewardToQueue('reward123', 'queue123', 'branch1');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('subscribeToUserSummary', () => {
    it('should return unsubscribe function', async () => {
      const { onSnapshot } = await import('firebase/firestore');
      const mockUnsubscribe = vi.fn();

      (onSnapshot as any).mockReturnValue(mockUnsubscribe);

      const callback = vi.fn();
      const unsubscribe = subscribeToUserSummary('user123', callback);

      expect(typeof unsubscribe).toBe('function');
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should call callback with summary data when exists', async () => {
      const { onSnapshot } = await import('firebase/firestore');
      const mockSummary = {
        userId: 'user123',
        franchises: {
          franchise1: {
            activeStamps: 5,
            totalStampsEarned: 10,
          },
        },
      };

      (onSnapshot as any).mockImplementation((ref: any, callback: any) => {
        callback({
          exists: () => true,
          data: () => mockSummary,
        });
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeToUserSummary('user123', callback);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          franchises: expect.any(Object),
        })
      );
    });

    it('should call callback with null when summary does not exist', async () => {
      const { onSnapshot } = await import('firebase/firestore');

      (onSnapshot as any).mockImplementation((ref: any, callback: any) => {
        callback({
          exists: () => false,
        });
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeToUserSummary('user123', callback);

      expect(callback).toHaveBeenCalledWith(null);
    });
  });
});
