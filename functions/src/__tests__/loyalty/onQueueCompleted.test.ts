import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as admin from 'firebase-admin';
import * as testUtils from 'firebase-functions-test';

// Mock configuration
vi.mock('../../config', () => ({
  config: { region: 'europe-west1' }
}));

const test = testUtils();

describe('onQueueCompleted - Stamp Creation Trigger', () => {
  let firestoreStub: any;
  let transactionStub: any;

  beforeEach(() => {
    // Initialize mocks
    firestoreStub = {
      collection: vi.fn().mockReturnThis(),
      doc: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
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

  it('should create stamp when queue status changes to completed', async () => {
    const before = {
      status: 'in_service',
      userId: 'user123',
      franchiseId: 'franchise1',
      branchId: 'branch1',
      serviceId: 'haircut',
      barberId: 'barber1',
    };

    const after = {
      ...before,
      status: 'completed',
    };

    const config = {
      franchiseId: 'franchise1',
      enabled: true,
      stampsRequired: 10,
      eligibleServices: { mode: 'all', serviceIds: [] },
      stampExpiration: { enabled: true, days: 30 },
    };

    // Mock config fetch
    firestoreStub.get.mockResolvedValueOnce({
      exists: true,
      data: () => config,
    });

    // Mock transaction - no existing stamps
    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get.mockResolvedValueOnce({ empty: true, docs: [] });
      return callback(transactionStub);
    });

    const { onQueueCompleted } = await import('../../loyalty');

    const event = {
      params: { queueId: 'queue123' },
      data: {
        before: { data: () => before },
        after: { data: () => after },
      },
    };

    await (onQueueCompleted as any)(event);

    expect(firestoreStub.runTransaction).toHaveBeenCalled();
    expect(transactionStub.set).toHaveBeenCalled();
  });

  it('should use transaction to prevent duplicate stamps for same queueId', async () => {
    const before = { status: 'in_service' };
    const after = {
      status: 'completed',
      userId: 'user123',
      franchiseId: 'franchise1',
      branchId: 'branch1',
      serviceId: 'haircut',
      barberId: 'barber1',
    };

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

    // Mock existing stamp found
    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get.mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'existing-stamp' }],
      });
      return callback(transactionStub);
    });

    const { onQueueCompleted } = await import('../../loyalty');

    const event = {
      params: { queueId: 'queue123' },
      data: {
        before: { data: () => before },
        after: { data: () => after },
      },
    };

    await (onQueueCompleted as any)(event);

    // Should NOT create new stamp
    expect(transactionStub.set).not.toHaveBeenCalled();
  });

  it('should validate franchise isolation', async () => {
    const before = { status: 'in_service' };
    const after = {
      status: 'completed',
      userId: 'user123',
      franchiseId: 'franchise1',
      branchId: 'branch1',
      serviceId: 'haircut',
      barberId: 'barber1',
    };

    // Stamp should include franchiseId
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
        before: { data: () => before },
        after: { data: () => after },
      },
    };

    await (onQueueCompleted as any)(event);

    const stampCall = transactionStub.set.mock.calls[0];
    expect(stampCall[1]).toMatchObject({
      franchiseId: 'franchise1',
      userId: 'user123',
    });
  });

  it('should handle missing serviceId/barberId gracefully', async () => {
    const before = { status: 'in_service' };
    const after = {
      status: 'completed',
      userId: 'user123',
      franchiseId: 'franchise1',
      branchId: 'branch1',
      // serviceId and barberId missing
    };

    const { onQueueCompleted } = await import('../../loyalty');

    const event = {
      params: { queueId: 'queue123' },
      data: {
        before: { data: () => before },
        after: { data: () => after },
      },
    };

    await (onQueueCompleted as any)(event);

    // Should not create stamp and should not throw
    expect(firestoreStub.runTransaction).not.toHaveBeenCalled();
  });

  it('should not process if already completed', async () => {
    const before = { status: 'completed' };
    const after = { status: 'completed' };

    const { onQueueCompleted } = await import('../../loyalty');

    const event = {
      params: { queueId: 'queue123' },
      data: {
        before: { data: () => before },
        after: { data: () => after },
      },
    };

    await (onQueueCompleted as any)(event);

    expect(firestoreStub.runTransaction).not.toHaveBeenCalled();
  });

  it('should only process when changing TO completed status', async () => {
    const before = { status: 'waiting' };
    const after = { status: 'in_service' };

    const { onQueueCompleted } = await import('../../loyalty');

    const event = {
      params: { queueId: 'queue123' },
      data: {
        before: { data: () => before },
        after: { data: () => after },
      },
    };

    await (onQueueCompleted as any)(event);

    expect(firestoreStub.runTransaction).not.toHaveBeenCalled();
  });

  it('should not create stamp if loyalty not enabled for franchise', async () => {
    const before = { status: 'in_service' };
    const after = {
      status: 'completed',
      userId: 'user123',
      franchiseId: 'franchise1',
      branchId: 'branch1',
      serviceId: 'haircut',
      barberId: 'barber1',
    };

    const config = {
      franchiseId: 'franchise1',
      enabled: false, // Disabled
      stampsRequired: 10,
    };

    firestoreStub.get.mockResolvedValueOnce({
      exists: true,
      data: () => config,
    });

    const { onQueueCompleted } = await import('../../loyalty');

    const event = {
      params: { queueId: 'queue123' },
      data: {
        before: { data: () => before },
        after: { data: () => after },
      },
    };

    await (onQueueCompleted as any)(event);

    expect(firestoreStub.runTransaction).not.toHaveBeenCalled();
  });

  it('should respect eligible services configuration', async () => {
    const before = { status: 'in_service' };
    const after = {
      status: 'completed',
      userId: 'user123',
      franchiseId: 'franchise1',
      branchId: 'branch1',
      serviceId: 'coloring', // Not in eligible list
      barberId: 'barber1',
    };

    const config = {
      franchiseId: 'franchise1',
      enabled: true,
      eligibleServices: {
        mode: 'specific',
        serviceIds: ['haircut', 'beard'], // coloring not included
      },
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
        before: { data: () => before },
        after: { data: () => after },
      },
    };

    await (onQueueCompleted as any)(event);

    // Should not create stamp for ineligible service
    expect(firestoreStub.runTransaction).not.toHaveBeenCalled();
  });

  it('should generate reward when user reaches required stamps', async () => {
    const before = { status: 'in_service' };
    const after = {
      status: 'completed',
      userId: 'user123',
      franchiseId: 'franchise1',
      branchId: 'branch1',
      serviceId: 'haircut',
      barberId: 'barber1',
    };

    const config = {
      franchiseId: 'franchise1',
      enabled: true,
      stampsRequired: 5,
      eligibleServices: { mode: 'all', serviceIds: [] },
      stampExpiration: { enabled: false },
      rewardExpiration: { enabled: false },
    };

    firestoreStub.get
      .mockResolvedValueOnce({ exists: true, data: () => config })
      // For checking active stamps count
      .mockResolvedValueOnce({
        size: 5,
        docs: Array(5).fill({ id: 'stamp', data: () => ({ status: 'active' }) }),
      });

    firestoreStub.runTransaction.mockImplementation(async (callback: any) => {
      transactionStub.get.mockResolvedValueOnce({ empty: true });
      return callback(transactionStub);
    });

    const { onQueueCompleted } = await import('../../loyalty');

    const event = {
      params: { queueId: 'queue123' },
      data: {
        before: { data: () => before },
        after: { data: () => after },
      },
    };

    await (onQueueCompleted as any)(event);

    // Should check for reward generation
    expect(firestoreStub.collection).toHaveBeenCalledWith('loyalty_stamps');
  });
});
