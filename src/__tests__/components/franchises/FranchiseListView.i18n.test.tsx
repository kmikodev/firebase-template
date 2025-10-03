/**
 * FranchiseListView i18n Tests
 *
 * Tests internationalization for the FranchiseListView component including:
 * - Table headers (Logo, Name, Contact, Plan, Status, Actions)
 * - Plan tier labels (Free, Basic, Premium, Enterprise)
 * - Status labels (Active/Inactive)
 * - Action buttons (Edit/Delete)
 * - Language switching
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { FranchiseListView } from '@/components/franchises/FranchiseListView';
import { render, createMockFranchise } from '@/test/test-utils';

describe('FranchiseListView i18n', () => {
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

  describe('English translations', () => {
    it('should display table headers in English', () => {
      render(<FranchiseListView {...defaultProps} />, { language: 'en' });

      expect(screen.getByText('Logo')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Plan')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should display plan tier labels in English', () => {
      const franchises = [
        createMockFranchise({ franchiseId: '1', planTier: 'free' }),
        createMockFranchise({ franchiseId: '2', planTier: 'basic' }),
        createMockFranchise({ franchiseId: '3', planTier: 'premium' }),
        createMockFranchise({ franchiseId: '4', planTier: 'enterprise' }),
      ];

      render(<FranchiseListView {...defaultProps} franchises={franchises} />, { language: 'en' });

      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('Basic')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
    });

    it('should display Active status in English', () => {
      const franchises = [
        createMockFranchise({ franchiseId: '1', isActive: true }),
      ];

      render(<FranchiseListView {...defaultProps} franchises={franchises} />, { language: 'en' });

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should display Inactive status in English', () => {
      const franchises = [
        createMockFranchise({ franchiseId: '1', isActive: false }),
      ];

      render(<FranchiseListView {...defaultProps} franchises={franchises} />, { language: 'en' });

      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should display action buttons in English', () => {
      const franchises = [createMockFranchise()];

      render(<FranchiseListView {...defaultProps} franchises={franchises} />, { language: 'en' });

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should display multiple statuses in English', () => {
      const franchises = [
        createMockFranchise({ franchiseId: '1', name: 'Active Franchise', isActive: true }),
        createMockFranchise({ franchiseId: '2', name: 'Inactive Franchise', isActive: false }),
      ];

      render(<FranchiseListView {...defaultProps} franchises={franchises} />, { language: 'en' });

      const activeLabels = screen.getAllByText('Active');
      const inactiveLabels = screen.getAllByText('Inactive');

      expect(activeLabels.length).toBe(1);
      expect(inactiveLabels.length).toBe(1);
    });
  });

  describe('Spanish translations', () => {
    it('should display table headers in Spanish', () => {
      render(<FranchiseListView {...defaultProps} />, { language: 'es' });

      expect(screen.getByText('Logo')).toBeInTheDocument();
      expect(screen.getByText('Nombre')).toBeInTheDocument();
      expect(screen.getByText('Contacto')).toBeInTheDocument();
      expect(screen.getByText('Plan')).toBeInTheDocument();
      expect(screen.getByText('Estado')).toBeInTheDocument();
      expect(screen.getByText('Acciones')).toBeInTheDocument();
    });

    it('should display plan tier labels in Spanish', () => {
      const franchises = [
        createMockFranchise({ franchiseId: '1', planTier: 'free' }),
        createMockFranchise({ franchiseId: '2', planTier: 'basic' }),
        createMockFranchise({ franchiseId: '3', planTier: 'premium' }),
        createMockFranchise({ franchiseId: '4', planTier: 'enterprise' }),
      ];

      render(<FranchiseListView {...defaultProps} franchises={franchises} />, { language: 'es' });

      expect(screen.getByText('Gratis')).toBeInTheDocument();
      expect(screen.getByText('Básico')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
      expect(screen.getByText('Empresarial')).toBeInTheDocument();
    });

    it('should display Active status in Spanish', () => {
      const franchises = [
        createMockFranchise({ franchiseId: '1', isActive: true }),
      ];

      render(<FranchiseListView {...defaultProps} franchises={franchises} />, { language: 'es' });

      expect(screen.getByText('Activo')).toBeInTheDocument();
    });

    it('should display Inactive status in Spanish', () => {
      const franchises = [
        createMockFranchise({ franchiseId: '1', isActive: false }),
      ];

      render(<FranchiseListView {...defaultProps} franchises={franchises} />, { language: 'es' });

      expect(screen.getByText('Inactivo')).toBeInTheDocument();
    });

    it('should display action buttons in Spanish', () => {
      const franchises = [createMockFranchise()];

      render(<FranchiseListView {...defaultProps} franchises={franchises} />, { language: 'es' });

      expect(screen.getByText('Editar')).toBeInTheDocument();
      expect(screen.getByText('Eliminar')).toBeInTheDocument();
    });

    it('should display multiple statuses in Spanish', () => {
      const franchises = [
        createMockFranchise({ franchiseId: '1', name: 'Active Franchise', isActive: true }),
        createMockFranchise({ franchiseId: '2', name: 'Inactive Franchise', isActive: false }),
      ];

      render(<FranchiseListView {...defaultProps} franchises={franchises} />, { language: 'es' });

      const activeLabels = screen.getAllByText('Activo');
      const inactiveLabels = screen.getAllByText('Inactivo');

      expect(activeLabels.length).toBe(1);
      expect(inactiveLabels.length).toBe(1);
    });
  });

  describe('Language switching', () => {
    it('should update headers when switching from English to Spanish', async () => {
      const { changeLanguage } = render(<FranchiseListView {...defaultProps} />, { language: 'en' });

      // Verify English headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();

      // Switch to Spanish
      changeLanguage('es');

      // Verify Spanish headers
      await waitFor(() => {
        expect(screen.getByText('Nombre')).toBeInTheDocument();
        expect(screen.getByText('Contacto')).toBeInTheDocument();
        expect(screen.getByText('Estado')).toBeInTheDocument();
        expect(screen.getByText('Acciones')).toBeInTheDocument();
      });
    });

    it('should update plan tiers when switching from English to Spanish', async () => {
      const franchises = [
        createMockFranchise({ franchiseId: '1', planTier: 'basic' }),
        createMockFranchise({ franchiseId: '2', planTier: 'premium' }),
      ];

      const { changeLanguage } = render(
        <FranchiseListView {...defaultProps} franchises={franchises} />,
        { language: 'en' }
      );

      // Verify English
      expect(screen.getByText('Basic')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();

      // Switch to Spanish
      changeLanguage('es');

      // Verify Spanish
      await waitFor(() => {
        expect(screen.getByText('Básico')).toBeInTheDocument();
        expect(screen.getByText('Premium')).toBeInTheDocument(); // Premium is same
      });
    });

    it('should update status labels when switching from English to Spanish', async () => {
      const franchises = [
        createMockFranchise({ franchiseId: '1', isActive: true }),
        createMockFranchise({ franchiseId: '2', isActive: false }),
      ];

      const { changeLanguage } = render(
        <FranchiseListView {...defaultProps} franchises={franchises} />,
        { language: 'en' }
      );

      // Verify English
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();

      // Switch to Spanish
      changeLanguage('es');

      // Verify Spanish
      await waitFor(() => {
        expect(screen.getByText('Activo')).toBeInTheDocument();
        expect(screen.getByText('Inactivo')).toBeInTheDocument();
      });
    });

    it('should update action buttons when switching from English to Spanish', async () => {
      const franchises = [createMockFranchise()];

      const { changeLanguage } = render(
        <FranchiseListView {...defaultProps} franchises={franchises} />,
        { language: 'en' }
      );

      // Verify English
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();

      // Switch to Spanish
      changeLanguage('es');

      // Verify Spanish
      await waitFor(() => {
        expect(screen.getByText('Editar')).toBeInTheDocument();
        expect(screen.getByText('Eliminar')).toBeInTheDocument();
      });
    });

    it('should update all text when switching from Spanish to English', async () => {
      const franchises = [
        createMockFranchise({ franchiseId: '1', planTier: 'enterprise', isActive: true }),
      ];

      const { changeLanguage } = render(
        <FranchiseListView {...defaultProps} franchises={franchises} />,
        { language: 'es' }
      );

      // Verify Spanish
      expect(screen.getByText('Nombre')).toBeInTheDocument();
      expect(screen.getByText('Empresarial')).toBeInTheDocument();
      expect(screen.getByText('Activo')).toBeInTheDocument();
      expect(screen.getByText('Editar')).toBeInTheDocument();

      // Switch to English
      changeLanguage('en');

      // Verify English
      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Enterprise')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });
    });
  });

  describe('All plan tiers translations', () => {
    it('should correctly translate all plan tiers in English', () => {
      const franchises = [
        createMockFranchise({ franchiseId: '1', name: 'Free Franchise', planTier: 'free' }),
        createMockFranchise({ franchiseId: '2', name: 'Basic Franchise', planTier: 'basic' }),
        createMockFranchise({ franchiseId: '3', name: 'Premium Franchise', planTier: 'premium' }),
        createMockFranchise({ franchiseId: '4', name: 'Enterprise Franchise', planTier: 'enterprise' }),
      ];

      render(<FranchiseListView {...defaultProps} franchises={franchises} />, { language: 'en' });

      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('Basic')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
    });

    it('should correctly translate all plan tiers in Spanish', () => {
      const franchises = [
        createMockFranchise({ franchiseId: '1', name: 'Free Franchise', planTier: 'free' }),
        createMockFranchise({ franchiseId: '2', name: 'Basic Franchise', planTier: 'basic' }),
        createMockFranchise({ franchiseId: '3', name: 'Premium Franchise', planTier: 'premium' }),
        createMockFranchise({ franchiseId: '4', name: 'Enterprise Franchise', planTier: 'enterprise' }),
      ];

      render(<FranchiseListView {...defaultProps} franchises={franchises} />, { language: 'es' });

      expect(screen.getByText('Gratis')).toBeInTheDocument();
      expect(screen.getByText('Básico')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
      expect(screen.getByText('Empresarial')).toBeInTheDocument();
    });
  });

  describe('Multiple franchises with mixed content', () => {
    it('should translate all elements correctly with multiple franchises in English', () => {
      const franchises = [
        createMockFranchise({
          franchiseId: '1',
          name: 'Franchise A',
          planTier: 'basic',
          isActive: true,
        }),
        createMockFranchise({
          franchiseId: '2',
          name: 'Franchise B',
          planTier: 'enterprise',
          isActive: false,
        }),
      ];

      render(<FranchiseListView {...defaultProps} franchises={franchises} />, { language: 'en' });

      // Headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Plan')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();

      // Plan tiers
      expect(screen.getByText('Basic')).toBeInTheDocument();
      expect(screen.getByText('Enterprise')).toBeInTheDocument();

      // Statuses
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();

      // Actions (2 franchises = 2 Edit + 2 Delete buttons)
      const editButtons = screen.getAllByText('Edit');
      const deleteButtons = screen.getAllByText('Delete');
      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });

    it('should translate all elements correctly with multiple franchises in Spanish', () => {
      const franchises = [
        createMockFranchise({
          franchiseId: '1',
          name: 'Franchise A',
          planTier: 'free',
          isActive: true,
        }),
        createMockFranchise({
          franchiseId: '2',
          name: 'Franchise B',
          planTier: 'premium',
          isActive: false,
        }),
      ];

      render(<FranchiseListView {...defaultProps} franchises={franchises} />, { language: 'es' });

      // Headers
      expect(screen.getByText('Nombre')).toBeInTheDocument();
      expect(screen.getByText('Plan')).toBeInTheDocument();
      expect(screen.getByText('Estado')).toBeInTheDocument();

      // Plan tiers
      expect(screen.getByText('Gratis')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();

      // Statuses
      expect(screen.getByText('Activo')).toBeInTheDocument();
      expect(screen.getByText('Inactivo')).toBeInTheDocument();

      // Actions
      const editButtons = screen.getAllByText('Editar');
      const deleteButtons = screen.getAllByText('Eliminar');
      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty franchise list with translated headers', () => {
      render(<FranchiseListView {...defaultProps} franchises={[]} />, { language: 'en' });

      expect(screen.getByText('Logo')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Plan')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should handle rapid language switching with franchises', async () => {
      const franchises = [createMockFranchise({ planTier: 'basic', isActive: true })];
      const { changeLanguage } = render(
        <FranchiseListView {...defaultProps} franchises={franchises} />,
        { language: 'en' }
      );

      // Switch to Spanish
      changeLanguage('es');
      await waitFor(() => {
        expect(screen.getByText('Básico')).toBeInTheDocument();
      });

      // Switch back to English
      changeLanguage('en');
      await waitFor(() => {
        expect(screen.getByText('Basic')).toBeInTheDocument();
      });

      // Switch to Spanish again
      changeLanguage('es');
      await waitFor(() => {
        expect(screen.getByText('Básico')).toBeInTheDocument();
      });
    });

    it('should preserve data integrity when switching languages', async () => {
      const franchises = [
        createMockFranchise({
          franchiseId: 'test-123',
          name: 'Test Franchise Name',
          email: 'test@example.com',
          phone: '+34 123 456 789',
          planTier: 'premium',
          isActive: true,
        }),
      ];

      const { changeLanguage } = render(
        <FranchiseListView {...defaultProps} franchises={franchises} />,
        { language: 'en' }
      );

      // Verify data is displayed
      expect(screen.getByText('Test Franchise Name')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('+34 123 456 789')).toBeInTheDocument();

      // Switch language
      changeLanguage('es');

      // Verify data is still displayed (unchanged)
      await waitFor(() => {
        expect(screen.getByText('Test Franchise Name')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText('+34 123 456 789')).toBeInTheDocument();
      });
    });
  });

  describe('Action button functionality with i18n', () => {
    it('should trigger onEdit with correct ID when Edit button clicked in English', async () => {
      const franchises = [createMockFranchise({ franchiseId: 'test-id' })];
      const { user } = render(
        <FranchiseListView {...defaultProps} franchises={franchises} />,
        { language: 'en' }
      );

      const editButton = screen.getByText('Edit');
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith('test-id');
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should trigger onEdit with correct ID when Edit button clicked in Spanish', async () => {
      const franchises = [createMockFranchise({ franchiseId: 'test-id' })];
      const { user } = render(
        <FranchiseListView {...defaultProps} franchises={franchises} />,
        { language: 'es' }
      );

      const editButton = screen.getByText('Editar');
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith('test-id');
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should trigger onDelete with correct ID when Delete button clicked in English', async () => {
      const franchises = [createMockFranchise({ franchiseId: 'test-id' })];
      const { user } = render(
        <FranchiseListView {...defaultProps} franchises={franchises} />,
        { language: 'en' }
      );

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith('test-id');
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('should trigger onDelete with correct ID when Delete button clicked in Spanish', async () => {
      const franchises = [createMockFranchise({ franchiseId: 'test-id' })];
      const { user } = render(
        <FranchiseListView {...defaultProps} franchises={franchises} />,
        { language: 'es' }
      );

      const deleteButton = screen.getByText('Eliminar');
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith('test-id');
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });
  });
});
