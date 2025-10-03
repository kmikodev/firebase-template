import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import LoyaltyCard from '@/components/loyalty/LoyaltyCard';
import { useAuth } from '@/contexts/AuthContext';
import * as loyaltyService from '@/services/loyaltyService';

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/services/loyaltyService');
vi.mock('@/components/loyalty/StampProgress', () => ({
  default: ({ activeStamps, requiredStamps, progress }: any) => (
    <div data-testid="stamp-progress">
      {activeStamps}/{requiredStamps} ({progress}%)
    </div>
  ),
}));
vi.mock('@/components/loyalty/RewardsList', () => ({
  default: ({ rewards }: any) => (
    <div data-testid="rewards-list">Rewards: {rewards.length}</div>
  ),
}));

describe('LoyaltyCard', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'client' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render loading state initially', () => {
    const mockUnsubscribe = vi.fn();
    (loyaltyService.subscribeToUserSummary as any).mockReturnValue(mockUnsubscribe);
    (loyaltyService.getUserStamps as any).mockResolvedValue([]);
    (loyaltyService.getUserRewards as any).mockResolvedValue([]);

    render(<LoyaltyCard franchiseId="franchise1" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should fetch and display user summary', async () => {
    const mockSummary = {
      userId: 'user123',
      franchises: {
        franchise1: {
          activeStamps: 5,
          totalStampsEarned: 10,
          totalRewardsGenerated: 2,
          totalRewardsRedeemed: 1,
          currentProgress: {
            stamps: 5,
            required: 10,
            percentage: 50,
          },
        },
      },
    };

    let summaryCallback: any;
    const mockUnsubscribe = vi.fn();
    (loyaltyService.subscribeToUserSummary as any).mockImplementation(
      (userId: string, callback: any) => {
        summaryCallback = callback;
        setTimeout(() => callback(mockSummary), 0);
        return mockUnsubscribe;
      }
    );

    (loyaltyService.getUserStamps as any).mockResolvedValue([]);
    (loyaltyService.getUserRewards as any).mockResolvedValue([]);

    render(<LoyaltyCard franchiseId="franchise1" />);

    await waitFor(() => {
      expect(screen.getByText('Tarjeta de Fidelización')).toBeInTheDocument();
    });

    expect(screen.getByText('2')).toBeInTheDocument(); // Total rewards
    expect(screen.getByText('5')).toBeInTheDocument(); // Active stamps
    expect(screen.getByText('1')).toBeInTheDocument(); // Redeemed
  });

  it('should show correct stamps count and progress', async () => {
    const mockSummary = {
      userId: 'user123',
      franchises: {
        franchise1: {
          activeStamps: 7,
          totalStampsEarned: 15,
          currentProgress: {
            stamps: 7,
            required: 10,
            percentage: 70,
          },
        },
      },
    };

    const mockStamps = [
      { stampId: 'stamp1', status: 'active' },
      { stampId: 'stamp2', status: 'active' },
      { stampId: 'stamp3', status: 'active' },
      { stampId: 'stamp4', status: 'active' },
      { stampId: 'stamp5', status: 'active' },
      { stampId: 'stamp6', status: 'active' },
      { stampId: 'stamp7', status: 'active' },
    ];

    const mockUnsubscribe = vi.fn();
    (loyaltyService.subscribeToUserSummary as any).mockImplementation(
      (userId: string, callback: any) => {
        setTimeout(() => callback(mockSummary), 0);
        return mockUnsubscribe;
      }
    );

    (loyaltyService.getUserStamps as any).mockResolvedValue(mockStamps);
    (loyaltyService.getUserRewards as any).mockResolvedValue([]);

    render(<LoyaltyCard franchiseId="franchise1" />);

    await waitFor(() => {
      expect(screen.getByTestId('stamp-progress')).toHaveTextContent('7/10 (70%)');
    });
  });

  it('should display rewards count', async () => {
    const mockSummary = {
      userId: 'user123',
      franchises: {
        franchise1: {
          activeStamps: 5,
          totalRewardsGenerated: 3,
          currentProgress: {
            stamps: 5,
            required: 10,
            percentage: 50,
          },
        },
      },
    };

    const mockRewards = [
      { rewardId: 'reward1', status: 'generated' },
      { rewardId: 'reward2', status: 'generated' },
      { rewardId: 'reward3', status: 'active' },
    ];

    const mockUnsubscribe = vi.fn();
    (loyaltyService.subscribeToUserSummary as any).mockImplementation(
      (userId: string, callback: any) => {
        setTimeout(() => callback(mockSummary), 0);
        return mockUnsubscribe;
      }
    );

    (loyaltyService.getUserStamps as any).mockResolvedValue([]);
    (loyaltyService.getUserRewards as any).mockResolvedValue(mockRewards);

    render(<LoyaltyCard franchiseId="franchise1" />);

    await waitFor(() => {
      expect(screen.getByTestId('rewards-list')).toHaveTextContent('Rewards: 3');
    });
  });

  it('should show expiration warning when stamps expiring in ≤7 days', async () => {
    const now = new Date();
    const expiringDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days

    const mockSummary = {
      userId: 'user123',
      franchises: {
        franchise1: {
          activeStamps: 3,
          currentProgress: {
            stamps: 3,
            required: 10,
            percentage: 30,
          },
        },
      },
    };

    const mockStamps = [
      {
        stampId: 'stamp1',
        status: 'active',
        expiresAt: {
          toDate: () => expiringDate,
        },
      },
    ];

    const mockUnsubscribe = vi.fn();
    (loyaltyService.subscribeToUserSummary as any).mockImplementation(
      (userId: string, callback: any) => {
        setTimeout(() => callback(mockSummary), 0);
        return mockUnsubscribe;
      }
    );

    (loyaltyService.getUserStamps as any).mockResolvedValue(mockStamps);
    (loyaltyService.getUserRewards as any).mockResolvedValue([]);

    render(<LoyaltyCard franchiseId="franchise1" />);

    await waitFor(() => {
      expect(screen.getByText('Sellos por expirar')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        'Tienes sellos que vencen pronto. ¡Acumula más para conseguir tu recompensa!'
      )
    ).toBeInTheDocument();
  });

  it('should not show expiration warning when no stamps expiring soon', async () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const mockSummary = {
      userId: 'user123',
      franchises: {
        franchise1: {
          activeStamps: 3,
          currentProgress: {
            stamps: 3,
            required: 10,
            percentage: 30,
          },
        },
      },
    };

    const mockStamps = [
      {
        stampId: 'stamp1',
        status: 'active',
        expiresAt: {
          toDate: () => futureDate,
        },
      },
    ];

    const mockUnsubscribe = vi.fn();
    (loyaltyService.subscribeToUserSummary as any).mockImplementation(
      (userId: string, callback: any) => {
        setTimeout(() => callback(mockSummary), 0);
        return mockUnsubscribe;
      }
    );

    (loyaltyService.getUserStamps as any).mockResolvedValue(mockStamps);
    (loyaltyService.getUserRewards as any).mockResolvedValue([]);

    render(<LoyaltyCard franchiseId="franchise1" />);

    await waitFor(() => {
      expect(screen.getByText('Tarjeta de Fidelización')).toBeInTheDocument();
    });

    expect(screen.queryByText('Sellos por expirar')).not.toBeInTheDocument();
  });

  it('should cleanup listener on unmount (no memory leaks)', async () => {
    const mockUnsubscribe = vi.fn();
    (loyaltyService.subscribeToUserSummary as any).mockReturnValue(mockUnsubscribe);
    (loyaltyService.getUserStamps as any).mockResolvedValue([]);
    (loyaltyService.getUserRewards as any).mockResolvedValue([]);

    const { unmount } = render(<LoyaltyCard franchiseId="franchise1" />);

    await waitFor(() => {
      expect(loyaltyService.subscribeToUserSummary).toHaveBeenCalled();
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const mockUnsubscribe = vi.fn();
    (loyaltyService.subscribeToUserSummary as any).mockImplementation(
      (userId: string, callback: any) => {
        setTimeout(() => callback(null), 0);
        return mockUnsubscribe;
      }
    );

    (loyaltyService.getUserStamps as any).mockRejectedValue(
      new Error('Failed to fetch stamps')
    );
    (loyaltyService.getUserRewards as any).mockRejectedValue(
      new Error('Failed to fetch rewards')
    );

    render(<LoyaltyCard franchiseId="franchise1" />);

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar datos/i)).toBeInTheDocument();
    });
  });

  it('should not render when user is not authenticated', () => {
    (useAuth as any).mockReturnValue({ user: null });

    const { container } = render(<LoyaltyCard franchiseId="franchise1" />);

    // Component should handle null user gracefully
    expect(container.firstChild).toBeNull();
  });

  it('should handle stamps without expiration dates', async () => {
    const mockSummary = {
      userId: 'user123',
      franchises: {
        franchise1: {
          activeStamps: 2,
          currentProgress: {
            stamps: 2,
            required: 10,
            percentage: 20,
          },
        },
      },
    };

    const mockStamps = [
      {
        stampId: 'stamp1',
        status: 'active',
        expiresAt: null, // No expiration
      },
      {
        stampId: 'stamp2',
        status: 'active',
        expiresAt: null,
      },
    ];

    const mockUnsubscribe = vi.fn();
    (loyaltyService.subscribeToUserSummary as any).mockImplementation(
      (userId: string, callback: any) => {
        setTimeout(() => callback(mockSummary), 0);
        return mockUnsubscribe;
      }
    );

    (loyaltyService.getUserStamps as any).mockResolvedValue(mockStamps);
    (loyaltyService.getUserRewards as any).mockResolvedValue([]);

    render(<LoyaltyCard franchiseId="franchise1" />);

    await waitFor(() => {
      expect(screen.getByText('Tarjeta de Fidelización')).toBeInTheDocument();
    });

    // Should not show expiration warning for stamps without expiration
    expect(screen.queryByText('Sellos por expirar')).not.toBeInTheDocument();
  });
});
