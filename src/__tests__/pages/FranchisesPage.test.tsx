import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FranchisesPage from '@/pages/FranchisesPage';
import { render, createMockFranchise } from '@/test/test-utils';

// Mock contexts and components
const mockNavigate = vi.fn();
const mockDeleteFranchise = vi.fn();
const mockRefreshFranchises = vi.fn();
let mockFranchiseContext = {
  franchises: [],
  loading: false,
  deleteFranchise: mockDeleteFranchise,
  refreshFranchises: mockRefreshFranchises,
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/contexts/FranchiseContext', () => ({
  useFranchise: () => mockFranchiseContext,
}));

// Mock child components
vi.mock('@/components/franchises/FranchiseCard', () => ({
  FranchiseCard: ({ franchise, onEdit, onDelete }: any) => (
    <div data-testid={`card-${franchise.franchiseId}`}>
      <span>{franchise.name}</span>
      <button onClick={() => onEdit(franchise.franchiseId)}>Edit</button>
      <button onClick={() => onDelete(franchise.franchiseId)}>Delete</button>
    </div>
  ),
}));

vi.mock('@/components/franchises/FranchiseListView', () => ({
  FranchiseListView: ({ franchises, onEdit, onDelete }: any) => (
    <div data-testid="list-view">
      {franchises.map((franchise: any) => (
        <div key={franchise.franchiseId} data-testid={`list-item-${franchise.franchiseId}`}>
          <span>{franchise.name}</span>
          <button onClick={() => onEdit(franchise.franchiseId)}>Edit</button>
          <button onClick={() => onDelete(franchise.franchiseId)}>Delete</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/shared/LoadingState', () => ({
  LoadingState: ({ message }: any) => <div data-testid="loading">{message}</div>,
}));

vi.mock('@/components/shared/EmptyState', () => ({
  EmptyState: ({ icon, title, message, actionLabel, onAction }: any) => (
    <div data-testid="empty-state">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{message}</p>
      <button onClick={onAction}>{actionLabel}</button>
    </div>
  ),
}));

vi.mock('@/components/shared/ConfirmDialog', () => ({
  ConfirmDialog: ({ open, title, message, confirmLabel, onConfirm, onClose }: any) =>
    open ? (
      <div data-testid="confirm-dialog">
        <h3>{title}</h3>
        <p>{message}</p>
        <button onClick={onConfirm}>{confirmLabel}</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

vi.mock('@/components/shared/SearchBar', () => ({
  SearchBar: ({ value, onChange, placeholder }: any) => (
    <input
      data-testid="search-bar"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

vi.mock('@/components/shared/FilterBar', () => ({
  FilterBar: ({ filters, onFilterChange, onReset }: any) => (
    <div data-testid="filter-bar">
      <button onClick={() => onFilterChange({ planTier: 'premium' })}>Filter Premium</button>
      <button onClick={onReset}>Reset</button>
    </div>
  ),
}));

vi.mock('@/components/shared/SortSelector', () => ({
  SortSelector: ({ value, onChange, onDirectionChange }: any) => (
    <div data-testid="sort-selector">
      <button onClick={() => onChange('email')}>Sort by Email</button>
      <button onClick={() => onDirectionChange('desc')}>Desc</button>
    </div>
  ),
}));

vi.mock('@/components/shared/ViewToggle', () => ({
  ViewToggle: ({ view, onChange }: any) => (
    <div data-testid="view-toggle">
      <button onClick={() => onChange('grid')}>Grid</button>
      <button onClick={() => onChange('list')}>List</button>
    </div>
  ),
}));

vi.mock('@/components/shared/Pagination', () => ({
  Pagination: ({ currentPage, totalPages, onPageChange }: any) => (
    <div data-testid="pagination">
      <button onClick={() => onPageChange(1)} disabled={currentPage === 1}>
        First
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        Next
      </button>
    </div>
  ),
}));

vi.mock('@/components/shared/Breadcrumbs', () => ({
  Breadcrumbs: ({ items }: any) => (
    <div data-testid="breadcrumbs">{items.map((item: any) => item.label).join(' > ')}</div>
  ),
}));

vi.mock('@/components/shared/ExportButton', () => ({
  ExportButton: ({ data, filename }: any) => (
    <button data-testid="export-button">Export {filename}</button>
  ),
}));

describe('FranchisesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFranchiseContext = {
      franchises: [],
      loading: false,
      deleteFranchise: mockDeleteFranchise,
      refreshFranchises: mockRefreshFranchises,
    };
  });

  describe('Loading State', () => {
    it('should show loading state when loading', () => {
      mockFranchiseContext.loading = true;

      render(<FranchisesPage />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByText('franchises.loading.franchises')).toBeInTheDocument();
    });

    it('should call refreshFranchises on mount', () => {
      render(<FranchisesPage />);

      expect(mockRefreshFranchises).toHaveBeenCalledTimes(1);
    });
  });

  describe('Header and Navigation', () => {
    it('should render page title and breadcrumbs', () => {
      render(<FranchisesPage />);

      expect(screen.getByText('franchises.title')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumbs')).toHaveTextContent('franchises.title');
    });

    it('should display franchise count', () => {
      const franchises = [
        createMockFranchise({ franchiseId: '1' }),
        createMockFranchise({ franchiseId: '2' }),
      ];

      mockFranchiseContext.franchises = franchises;

      render(<FranchisesPage />);

      expect(screen.getByText('franchises.count.total: 2')).toBeInTheDocument();
    });

    it('should have New Franchise button that navigates to create page', async () => {
      const user = userEvent.setup();
      render(<FranchisesPage />);

      const newButton = screen.getByText('+ franchises.add');
      await user.click(newButton);

      expect(mockNavigate).toHaveBeenCalledWith('/franchises/new');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no franchises exist', () => {
      render(<FranchisesPage />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('franchises.empty.title')).toBeInTheDocument();
      expect(screen.getByText('franchises.empty.noFranchises')).toBeInTheDocument();
    });

    it('should show different message when filters are active but no results', async () => {
      const user = userEvent.setup();
      const franchises = [createMockFranchise({ planTier: 'basic' })];

      mockFranchiseContext.franchises = franchises;

      render(<FranchisesPage />);

      // Apply filter that excludes all franchises
      const filterButton = screen.getByText('Filter Premium');
      await user.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('franchises.empty.noResults')).toBeInTheDocument();
      });
    });

    it('should navigate to create page when clicking empty state action', async () => {
      const user = userEvent.setup();
      render(<FranchisesPage />);

      const actionButton = screen.getByText('franchises.empty.action');
      await user.click(actionButton);

      expect(mockNavigate).toHaveBeenCalledWith('/franchises/new');
    });
  });

  describe('Search Functionality', () => {
    it('should filter franchises by name', async () => {
      const user = userEvent.setup();
      const franchises = [
        createMockFranchise({ franchiseId: '1', name: 'Alpha Franchise' }),
        createMockFranchise({ franchiseId: '2', name: 'Beta Franchise' }),
      ];

      mockFranchiseContext.franchises = franchises;

      render(<FranchisesPage />);

      const searchInput = screen.getByTestId('search-bar');
      await user.type(searchInput, 'Alpha');

      await waitFor(() => {
        expect(screen.getByTestId('card-1')).toBeInTheDocument();
        expect(screen.queryByTestId('card-2')).not.toBeInTheDocument();
      });
    });

    it('should filter franchises by email', async () => {
      const user = userEvent.setup();
      const franchises = [
        createMockFranchise({ franchiseId: '1', email: 'alpha@test.com' }),
        createMockFranchise({ franchiseId: '2', email: 'beta@test.com' }),
      ];

      mockFranchiseContext.franchises = franchises;

      render(<FranchisesPage />);

      const searchInput = screen.getByTestId('search-bar');
      await user.type(searchInput, 'beta');

      await waitFor(() => {
        expect(screen.queryByTestId('card-1')).not.toBeInTheDocument();
        expect(screen.getByTestId('card-2')).toBeInTheDocument();
      });
    });

    it('should be case-insensitive', async () => {
      const user = userEvent.setup();
      const franchises = [createMockFranchise({ franchiseId: '1', name: 'Test Franchise' })];

      mockFranchiseContext.franchises = franchises;

      render(<FranchisesPage />);

      const searchInput = screen.getByTestId('search-bar');
      await user.type(searchInput, 'TEST');

      await waitFor(() => {
        expect(screen.getByTestId('card-1')).toBeInTheDocument();
      });
    });
  });

  describe('View Toggle', () => {
    const franchises = [
      createMockFranchise({ franchiseId: '1', name: 'Franchise 1' }),
      createMockFranchise({ franchiseId: '2', name: 'Franchise 2' }),
    ];

    beforeEach(() => {
      mockFranchiseContext.franchises = franchises;
    });

    it('should default to grid view', () => {
      render(<FranchisesPage />);

      expect(screen.getByTestId('card-1')).toBeInTheDocument();
      expect(screen.getByTestId('card-2')).toBeInTheDocument();
    });

    it('should switch to list view when toggled', async () => {
      const user = userEvent.setup();
      render(<FranchisesPage />);

      const listButton = screen.getByText('List');
      await user.click(listButton);

      await waitFor(() => {
        expect(screen.getByTestId('list-view')).toBeInTheDocument();
        expect(screen.getByTestId('list-item-1')).toBeInTheDocument();
      });
    });

    it('should switch back to grid view', async () => {
      const user = userEvent.setup();
      render(<FranchisesPage />);

      // Switch to list
      await user.click(screen.getByText('List'));
      await waitFor(() => {
        expect(screen.getByTestId('list-view')).toBeInTheDocument();
      });

      // Switch back to grid
      await user.click(screen.getByText('Grid'));
      await waitFor(() => {
        expect(screen.queryByTestId('list-view')).not.toBeInTheDocument();
        expect(screen.getByTestId('card-1')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should paginate franchises when more than 9 exist', () => {
      const franchises = Array.from({ length: 15 }, (_, i) =>
        createMockFranchise({ franchiseId: `${i + 1}`, name: `Franchise ${i + 1}` })
      );

      mockFranchiseContext.franchises = franchises;

      render(<FranchisesPage />);

      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      expect(screen.getByTestId('card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('card-10')).not.toBeInTheDocument();
    });

    it('should navigate to next page', async () => {
      const user = userEvent.setup();
      const franchises = Array.from({ length: 15 }, (_, i) =>
        createMockFranchise({ franchiseId: `${i + 1}`, name: `Franchise ${i + 1}` })
      );

      mockFranchiseContext.franchises = franchises;

      render(<FranchisesPage />);

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Functionality', () => {
    it('should open confirm dialog when delete is clicked', async () => {
      const user = userEvent.setup();
      const franchises = [createMockFranchise({ franchiseId: '1' })];

      mockFranchiseContext.franchises = franchises;

      render(<FranchisesPage />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
        expect(screen.getByText('franchises.confirmDelete.title')).toBeInTheDocument();
      });
    });

    it('should delete franchise when confirmed', async () => {
      const user = userEvent.setup();
      const franchises = [createMockFranchise({ franchiseId: 'delete-me' })];

      mockFranchiseContext.franchises = franchises;

      render(<FranchisesPage />);

      await user.click(screen.getByText('Delete'));

      const confirmButton = await screen.findByText('franchises.confirmDelete.confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteFranchise).toHaveBeenCalledWith('delete-me');
      });
    });

    it('should close dialog when cancelled', async () => {
      const user = userEvent.setup();
      const franchises = [createMockFranchise({ franchiseId: '1' })];

      mockFranchiseContext.franchises = franchises;

      render(<FranchisesPage />);

      await user.click(screen.getByText('Delete'));
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();

      await user.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Functionality', () => {
    it('should navigate to edit page when edit is clicked', async () => {
      const user = userEvent.setup();
      const franchises = [createMockFranchise({ franchiseId: 'edit-123' })];

      mockFranchiseContext.franchises = franchises;

      render(<FranchisesPage />);

      const editButton = screen.getByText('Edit');
      await user.click(editButton);

      expect(mockNavigate).toHaveBeenCalledWith('/franchises/edit-123/edit');
    });
  });
});
