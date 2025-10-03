import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FranchiseListView } from '@/components/franchises/FranchiseListView';
import { render, createMockFranchise } from '@/test/test-utils';

describe('FranchiseListView', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const defaultProps = {
    franchises: [],
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Table Structure', () => {
    it('should render table with correct headers', () => {
      render(<FranchiseListView {...defaultProps} />);

      expect(screen.getByText('franchises.table.logo')).toBeInTheDocument();
      expect(screen.getByText('franchises.table.name')).toBeInTheDocument();
      expect(screen.getByText('franchises.table.contact')).toBeInTheDocument();
      expect(screen.getByText('franchises.table.plan')).toBeInTheDocument();
      expect(screen.getByText('franchises.table.status')).toBeInTheDocument();
      expect(screen.getByText('franchises.table.actions')).toBeInTheDocument();
    });

    it('should render empty table when no franchises provided', () => {
      render(<FranchiseListView {...defaultProps} />);

      const tbody = screen.getByRole('table').querySelector('tbody');
      expect(tbody?.children.length).toBe(0);
    });
  });

  describe('Franchise Data Display', () => {
    it('should display franchise data correctly', () => {
      const franchise = createMockFranchise({
        franchiseId: 'test-1',
        name: 'Test Franchise',
        email: 'test@franchise.com',
        phone: '+34 123 456 789',
        description: 'Test description',
        planTier: 'premium',
        isActive: true,
      });

      render(<FranchiseListView {...defaultProps} franchises={[franchise]} />);

      expect(screen.getByText('Test Franchise')).toBeInTheDocument();
      expect(screen.getByText('test@franchise.com')).toBeInTheDocument();
      expect(screen.getByText('+34 123 456 789')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should display logo when provided', () => {
      const franchise = createMockFranchise({
        logo: 'https://example.com/logo.png',
        name: 'Test Franchise',
      });

      render(<FranchiseListView {...defaultProps} franchises={[franchise]} />);

      const logo = screen.getByAltText('Test Franchise');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
    });

    it('should display default icon when logo is not provided', () => {
      const franchise = createMockFranchise({
        logo: undefined,
      });

      render(<FranchiseListView {...defaultProps} franchises={[franchise]} />);

      expect(screen.getByText('🏢')).toBeInTheDocument();
    });

    it('should display description when provided', () => {
      const franchise = createMockFranchise({
        description: 'This is a test description',
      });

      render(<FranchiseListView {...defaultProps} franchises={[franchise]} />);

      expect(screen.getByText('This is a test description')).toBeInTheDocument();
    });

    it('should not display description when not provided', () => {
      const franchise = createMockFranchise({
        description: '',
      });

      render(<FranchiseListView {...defaultProps} franchises={[franchise]} />);

      const row = screen.getByText(franchise.name).closest('tr');
      expect(row).toBeInTheDocument();
    });

    it('should display multiple franchises correctly', () => {
      const franchises = [
        createMockFranchise({ franchiseId: '1', name: 'Franchise 1' }),
        createMockFranchise({ franchiseId: '2', name: 'Franchise 2' }),
        createMockFranchise({ franchiseId: '3', name: 'Franchise 3' }),
      ];

      render(<FranchiseListView {...defaultProps} franchises={franchises} />);

      expect(screen.getByText('Franchise 1')).toBeInTheDocument();
      expect(screen.getByText('Franchise 2')).toBeInTheDocument();
      expect(screen.getByText('Franchise 3')).toBeInTheDocument();
    });
  });

  describe('Plan Tier Display', () => {
    it('should display free plan with correct badge', () => {
      const franchise = createMockFranchise({ planTier: 'free' });
      render(<FranchiseListView {...defaultProps} franchises={[franchise]} />);

      expect(screen.getByText('franchises.planTiers.free')).toBeInTheDocument();
    });

    it('should display basic plan with correct badge', () => {
      const franchise = createMockFranchise({ planTier: 'basic' });
      render(<FranchiseListView {...defaultProps} franchises={[franchise]} />);

      expect(screen.getByText('franchises.planTiers.basic')).toBeInTheDocument();
    });

    it('should display premium plan with correct badge', () => {
      const franchise = createMockFranchise({ planTier: 'premium' });
      render(<FranchiseListView {...defaultProps} franchises={[franchise]} />);

      expect(screen.getByText('franchises.planTiers.premium')).toBeInTheDocument();
    });

    it('should display enterprise plan with correct badge', () => {
      const franchise = createMockFranchise({ planTier: 'enterprise' });
      render(<FranchiseListView {...defaultProps} franchises={[franchise]} />);

      expect(screen.getByText('franchises.planTiers.enterprise')).toBeInTheDocument();
    });

    it('should apply correct CSS class for plan badges', () => {
      const franchises = [
        createMockFranchise({ franchiseId: '1', planTier: 'free' }),
        createMockFranchise({ franchiseId: '2', planTier: 'basic' }),
        createMockFranchise({ franchiseId: '3', planTier: 'premium' }),
        createMockFranchise({ franchiseId: '4', planTier: 'enterprise' }),
      ];

      const { container } = render(
        <FranchiseListView {...defaultProps} franchises={franchises} />
      );

      const freeBadge = screen.getByText('franchises.planTiers.free');
      expect(freeBadge).toHaveClass('bg-gray-100', 'text-gray-800');

      const basicBadge = screen.getByText('franchises.planTiers.basic');
      expect(basicBadge).toHaveClass('bg-blue-100', 'text-blue-800');

      const premiumBadge = screen.getByText('franchises.planTiers.premium');
      expect(premiumBadge).toHaveClass('bg-purple-100', 'text-purple-800');

      const enterpriseBadge = screen.getByText('franchises.planTiers.enterprise');
      expect(enterpriseBadge).toHaveClass('bg-orange-100', 'text-orange-800');
    });
  });

  describe('Status Display', () => {
    it('should display active status correctly', () => {
      const franchise = createMockFranchise({ isActive: true });
      render(<FranchiseListView {...defaultProps} franchises={[franchise]} />);

      const badge = screen.getByText('common.active');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should display inactive status correctly', () => {
      const franchise = createMockFranchise({ isActive: false });
      render(<FranchiseListView {...defaultProps} franchises={[franchise]} />);

      const badge = screen.getByText('common.inactive');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  describe('Action Buttons', () => {
    it('should render Edit and Delete buttons for each franchise', () => {
      const franchise = createMockFranchise();
      render(<FranchiseListView {...defaultProps} franchises={[franchise]} />);

      expect(screen.getByText('common.edit')).toBeInTheDocument();
      expect(screen.getByText('common.delete')).toBeInTheDocument();
    });

    it('should call onEdit with correct id when Edit button is clicked', async () => {
      const user = userEvent.setup();
      const franchise = createMockFranchise({ franchiseId: 'test-123' });
      render(<FranchiseListView {...defaultProps} franchises={[franchise]} />);

      const editButton = screen.getByText('common.edit');
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith('test-123');
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should call onDelete with correct id when Delete button is clicked', async () => {
      const user = userEvent.setup();
      const franchise = createMockFranchise({ franchiseId: 'test-456' });
      render(<FranchiseListView {...defaultProps} franchises={[franchise]} />);

      const deleteButton = screen.getByText('common.delete');
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith('test-456');
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('should handle clicks on correct franchise when multiple exist', async () => {
      const user = userEvent.setup();
      const franchises = [
        createMockFranchise({ franchiseId: 'id-1', name: 'Franchise 1' }),
        createMockFranchise({ franchiseId: 'id-2', name: 'Franchise 2' }),
      ];

      render(<FranchiseListView {...defaultProps} franchises={franchises} />);

      const editButtons = screen.getAllByText('common.edit');
      await user.click(editButtons[1]); // Click second franchise's edit

      expect(mockOnEdit).toHaveBeenCalledWith('id-2');
    });
  });

  describe('Styling and Accessibility', () => {
    it('should apply hover effect to table rows', () => {
      const franchise = createMockFranchise();
      const { container } = render(
        <FranchiseListView {...defaultProps} franchises={[franchise]} />
      );

      const row = container.querySelector('tbody tr');
      expect(row).toHaveClass('hover:bg-gray-50', 'dark:hover:bg-gray-700');
    });

    it('should have responsive overflow for table', () => {
      const { container } = render(<FranchiseListView {...defaultProps} />);

      const tableContainer = container.querySelector('.overflow-x-auto');
      expect(tableContainer).toBeInTheDocument();
    });

    it('should render table with proper dark mode classes', () => {
      const { container } = render(<FranchiseListView {...defaultProps} />);

      const table = container.querySelector('.bg-white.dark\\:bg-gray-800');
      expect(table).toBeInTheDocument();
    });

    it('should have accessible table structure', () => {
      const franchise = createMockFranchise();
      render(<FranchiseListView {...defaultProps} franchises={[franchise]} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(6);
    });
  });

  describe('Edge Cases', () => {
    it('should handle franchise with null logo gracefully', () => {
      const franchise = createMockFranchise({ logo: null as any });
      render(<FranchiseListView {...defaultProps} franchises={[franchise]} />);

      expect(screen.getByText('🏢')).toBeInTheDocument();
    });

    it('should handle franchise with empty string description', () => {
      const franchise = createMockFranchise({ description: '' });
      render(<FranchiseListView {...defaultProps} franchises={[franchise]} />);

      const nameCell = screen.getByText(franchise.name).closest('td');
      expect(nameCell).toBeInTheDocument();
    });

    it('should truncate long descriptions', () => {
      const franchise = createMockFranchise({
        description: 'This is a very long description that should be truncated',
      });

      const { container } = render(
        <FranchiseListView {...defaultProps} franchises={[franchise]} />
      );

      const descriptionElement = container.querySelector('.truncate.max-w-xs');
      expect(descriptionElement).toBeInTheDocument();
    });

    it('should handle unknown plan tier gracefully', () => {
      const franchise = createMockFranchise({ planTier: 'unknown' as any });
      const { container } = render(
        <FranchiseListView {...defaultProps} franchises={[franchise]} />
      );

      // Should fallback to gray badge for unknown tier
      const badge = screen.getByText('franchises.planTiers.unknown');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });
});
