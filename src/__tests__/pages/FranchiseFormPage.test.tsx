import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FranchiseFormPage from '@/pages/FranchiseFormPage';
import { render, createMockFranchise, createMockUser } from '@/test/test-utils';

// Mock dependencies
const mockNavigate = vi.fn();
const mockGetFranchise = vi.fn();
const mockCreateFranchise = vi.fn();
const mockUpdateFranchise = vi.fn();
let mockUseParams = {};
let mockAuthUser: any = createMockUser();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams,
  };
});

vi.mock('@/contexts/FranchiseContext', () => ({
  useFranchise: () => ({
    getFranchise: mockGetFranchise,
    createFranchise: mockCreateFranchise,
    updateFranchise: mockUpdateFranchise,
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockAuthUser,
  }),
}));

vi.mock('@/components/franchises/FranchiseForm', () => ({
  FranchiseForm: ({ franchise, ownerUserId, onSubmit, onCancel, isLoading }: any) => (
    <div data-testid="franchise-form">
      <span data-testid="owner-id">{ownerUserId}</span>
      <span data-testid="franchise-name">{franchise?.name || 'No franchise'}</span>
      <button onClick={() => onSubmit({ name: 'Test', email: 'test@test.com' })}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
      {isLoading && <span data-testid="loading-indicator">Loading...</span>}
    </div>
  ),
}));

vi.mock('@/components/shared/LoadingState', () => ({
  LoadingState: ({ message }: any) => <div data-testid="loading-state">{message}</div>,
}));

describe('FranchiseFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams = {};
    mockAuthUser = createMockUser();
  });

  describe('Create Mode', () => {
    it('should render form in create mode when no id param', () => {
      render(<FranchiseFormPage />);

      expect(screen.getByTestId('franchise-form')).toBeInTheDocument();
      expect(screen.getByTestId('franchise-name')).toHaveTextContent('No franchise');
    });

    it('should pass current user id as ownerUserId', () => {
      render(<FranchiseFormPage />);

      expect(screen.getByTestId('owner-id')).toHaveTextContent('test-user-1');
    });

    it('should not show loading state in create mode', () => {
      render(<FranchiseFormPage />);

      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });

    it('should call createFranchise on submit', async () => {
      const user = userEvent.setup();
      mockCreateFranchise.mockResolvedValue(undefined);

      render(<FranchiseFormPage />);

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateFranchise).toHaveBeenCalledWith({
          name: 'Test',
          email: 'test@test.com',
        });
      });
    });

    it('should navigate to franchises list after successful creation', async () => {
      const user = userEvent.setup();
      mockCreateFranchise.mockResolvedValue(undefined);

      render(<FranchiseFormPage />);

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/franchises');
      });
    });

    it('should show loading indicator while submitting', async () => {
      const user = userEvent.setup();
      mockCreateFranchise.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<FranchiseFormPage />);

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });
    });

    it('should handle creation errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockCreateFranchise.mockRejectedValue(new Error('Creation failed'));

      render(<FranchiseFormPage />);

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Error saving franchise:',
          expect.any(Error)
        );
      });

      // Should not navigate on error
      expect(mockNavigate).not.toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('Edit Mode', () => {
    const mockFranchise = createMockFranchise({
      franchiseId: 'edit-123',
      name: 'Existing Franchise',
    });

    beforeEach(() => {
      // Set useParams to return an id
      mockUseParams = { id: 'edit-123' };
      mockGetFranchise.mockResolvedValue(mockFranchise);
    });

    it('should show loading state while fetching franchise', () => {
      render(<FranchiseFormPage />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByText('franchises.loading.franchise')).toBeInTheDocument();
    });

    it('should load franchise data when id param is present', async () => {
      render(<FranchiseFormPage />);

      await waitFor(() => {
        expect(mockGetFranchise).toHaveBeenCalledWith('edit-123');
      });

      expect(screen.getByTestId('franchise-name')).toHaveTextContent('Existing Franchise');
    });

    it('should pass loaded franchise to form', async () => {
      render(<FranchiseFormPage />);

      await waitFor(() => {
        expect(screen.getByTestId('franchise-name')).toHaveTextContent('Existing Franchise');
      });
    });

    it('should call updateFranchise on submit in edit mode', async () => {
      const user = userEvent.setup();
      mockUpdateFranchise.mockResolvedValue(undefined);

      render(<FranchiseFormPage />);

      await waitFor(() => {
        expect(screen.getByTestId('franchise-name')).toHaveTextContent('Existing Franchise');
      });

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateFranchise).toHaveBeenCalledWith('edit-123', {
          name: 'Test',
          email: 'test@test.com',
        });
      });
    });

    it('should navigate to franchises list after successful update', async () => {
      const user = userEvent.setup();
      mockUpdateFranchise.mockResolvedValue(undefined);

      render(<FranchiseFormPage />);

      await waitFor(() => {
        expect(screen.getByTestId('franchise-form')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/franchises');
      });
    });

    it('should navigate to franchises list if franchise not found', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetFranchise.mockRejectedValue(new Error('Not found'));

      render(<FranchiseFormPage />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/franchises');
      });

      expect(consoleError).toHaveBeenCalledWith(
        'Error loading franchise:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });

    it('should handle update errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockUpdateFranchise.mockRejectedValue(new Error('Update failed'));

      render(<FranchiseFormPage />);

      await waitFor(() => {
        expect(screen.getByTestId('franchise-form')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Error saving franchise:',
          expect.any(Error)
        );
      });

      // Should not navigate on error
      expect(mockNavigate).toHaveBeenCalledTimes(0);

      consoleError.mockRestore();
    });
  });

  describe('Cancel Functionality', () => {
    it('should navigate back to franchises list when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<FranchiseFormPage />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/franchises');
    });

    it('should navigate back even in edit mode', async () => {
      const user = userEvent.setup();
      mockUseParams = { id: 'edit-123' };
      mockGetFranchise.mockResolvedValue(createMockFranchise());

      render(<FranchiseFormPage />);

      await waitFor(() => {
        expect(screen.getByTestId('franchise-form')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/franchises');
    });
  });

  describe('Loading States', () => {
    it('should not show loading state when franchise is loaded', async () => {
      mockUseParams = { id: 'edit-123' };
      mockGetFranchise.mockResolvedValue(createMockFranchise());

      render(<FranchiseFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      });
    });

    it('should disable form while submitting', async () => {
      const user = userEvent.setup();
      mockCreateFranchise.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<FranchiseFormPage />);

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  describe('User Context', () => {
    it('should handle missing user gracefully', () => {
      mockAuthUser = null;

      render(<FranchiseFormPage />);

      // Should still render but with empty owner id
      expect(screen.getByTestId('owner-id')).toHaveTextContent('');
    });

    it('should use authenticated user id for new franchises', () => {
      const customUser = createMockUser({ id: 'custom-user-456' });
      mockAuthUser = customUser;

      render(<FranchiseFormPage />);

      expect(screen.getByTestId('owner-id')).toHaveTextContent('custom-user-456');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid submit clicks', async () => {
      const user = userEvent.setup();
      mockCreateFranchise.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50))
      );

      render(<FranchiseFormPage />);

      const submitButton = screen.getByText('Submit');

      // Click multiple times rapidly
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateFranchise).toHaveBeenCalledTimes(1);
      });
    });

    it('should cleanup on unmount while loading', () => {
      mockUseParams = { id: 'edit-123' };
      mockGetFranchise.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(createMockFranchise()), 1000))
      );

      const { unmount } = render(<FranchiseFormPage />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();

      // Unmount before loading completes
      unmount();

      // Should not throw errors or cause memory leaks
    });

    it('should handle undefined franchise id param', () => {
      mockUseParams = { id: undefined };

      render(<FranchiseFormPage />);

      // Should be in create mode
      expect(screen.getByTestId('franchise-name')).toHaveTextContent('No franchise');
      expect(mockGetFranchise).not.toHaveBeenCalled();
    });
  });
});
