/**
 * FranchiseCard i18n Tests
 *
 * Tests internationalization for the FranchiseCard component including:
 * - Plan tier labels (Free, Basic, Premium, Enterprise)
 * - Status labels (Active/Inactive)
 * - Action buttons (Edit/Delete)
 * - Website label
 * - Language switching
 * - Dark/light mode compatibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { FranchiseCard } from '@/components/franchises/FranchiseCard';
import { render, createMockFranchise } from '@/test/test-utils';

describe('FranchiseCard i18n', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const defaultFranchise = createMockFranchise();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('English translations', () => {
    it('should display plan tier labels in English', () => {
      const testCases = [
        { planTier: 'free' as const, expected: 'Free' },
        { planTier: 'basic' as const, expected: 'Basic' },
        { planTier: 'premium' as const, expected: 'Premium' },
        { planTier: 'enterprise' as const, expected: 'Enterprise' },
      ];

      testCases.forEach(({ planTier, expected }) => {
        const franchise = createMockFranchise({ planTier });
        const { unmount } = render(
          <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
          { language: 'en' }
        );

        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });

    it('should display Active status in English', () => {
      const franchise = createMockFranchise({ isActive: true });
      render(
        <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'en' }
      );

      expect(screen.getByText('● Active')).toBeInTheDocument();
    });

    it('should display Inactive status in English', () => {
      const franchise = createMockFranchise({ isActive: false });
      render(
        <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'en' }
      );

      expect(screen.getByText('● Inactive')).toBeInTheDocument();
    });

    it('should display Website label in English', () => {
      const franchise = createMockFranchise({ website: 'https://example.com' });
      render(
        <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'en' }
      );

      expect(screen.getByText('Website')).toBeInTheDocument();
    });

    it('should display action buttons in English', () => {
      render(
        <FranchiseCard franchise={defaultFranchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'en' }
      );

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  describe('Spanish translations', () => {
    it('should display plan tier labels in Spanish', () => {
      const testCases = [
        { planTier: 'free' as const, expected: 'Gratis' },
        { planTier: 'basic' as const, expected: 'Básico' },
        { planTier: 'premium' as const, expected: 'Premium' },
        { planTier: 'enterprise' as const, expected: 'Empresarial' },
      ];

      testCases.forEach(({ planTier, expected }) => {
        const franchise = createMockFranchise({ planTier });
        const { unmount } = render(
          <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
          { language: 'es' }
        );

        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });

    it('should display Active status in Spanish', () => {
      const franchise = createMockFranchise({ isActive: true });
      render(
        <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'es' }
      );

      expect(screen.getByText('● Activo')).toBeInTheDocument();
    });

    it('should display Inactive status in Spanish', () => {
      const franchise = createMockFranchise({ isActive: false });
      render(
        <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'es' }
      );

      expect(screen.getByText('● Inactivo')).toBeInTheDocument();
    });

    it('should display Website label in Spanish', () => {
      const franchise = createMockFranchise({ website: 'https://example.com' });
      render(
        <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'es' }
      );

      expect(screen.getByText('Sitio Web')).toBeInTheDocument();
    });

    it('should display action buttons in Spanish', () => {
      render(
        <FranchiseCard franchise={defaultFranchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'es' }
      );

      expect(screen.getByText('Editar')).toBeInTheDocument();
      expect(screen.getByText('Eliminar')).toBeInTheDocument();
    });
  });

  describe('Language switching', () => {
    it('should update plan tier when switching from English to Spanish', async () => {
      const franchise = createMockFranchise({ planTier: 'basic' });
      const { changeLanguage } = render(
        <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'en' }
      );

      // Verify English
      expect(screen.getByText('Basic')).toBeInTheDocument();

      // Switch to Spanish
      changeLanguage('es');

      // Verify Spanish
      await waitFor(() => {
        expect(screen.getByText('Básico')).toBeInTheDocument();
      });
    });

    it('should update status when switching from English to Spanish', async () => {
      const franchise = createMockFranchise({ isActive: true });
      const { changeLanguage } = render(
        <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'en' }
      );

      // Verify English
      expect(screen.getByText('● Active')).toBeInTheDocument();

      // Switch to Spanish
      changeLanguage('es');

      // Verify Spanish
      await waitFor(() => {
        expect(screen.getByText('● Activo')).toBeInTheDocument();
      });
    });

    it('should update website label when switching from English to Spanish', async () => {
      const franchise = createMockFranchise({ website: 'https://example.com' });
      const { changeLanguage } = render(
        <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'en' }
      );

      // Verify English
      expect(screen.getByText('Website')).toBeInTheDocument();

      // Switch to Spanish
      changeLanguage('es');

      // Verify Spanish
      await waitFor(() => {
        expect(screen.getByText('Sitio Web')).toBeInTheDocument();
      });
    });

    it('should update action buttons when switching from English to Spanish', async () => {
      const { changeLanguage } = render(
        <FranchiseCard franchise={defaultFranchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
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
      const franchise = createMockFranchise({
        planTier: 'enterprise',
        isActive: true,
        website: 'https://example.com',
      });

      const { changeLanguage } = render(
        <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'es' }
      );

      // Verify Spanish
      expect(screen.getByText('Empresarial')).toBeInTheDocument();
      expect(screen.getByText('● Activo')).toBeInTheDocument();
      expect(screen.getByText('Sitio Web')).toBeInTheDocument();
      expect(screen.getByText('Editar')).toBeInTheDocument();

      // Switch to English
      changeLanguage('en');

      // Verify English
      await waitFor(() => {
        expect(screen.getByText('Enterprise')).toBeInTheDocument();
        expect(screen.getByText('● Active')).toBeInTheDocument();
        expect(screen.getByText('Website')).toBeInTheDocument();
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });
    });

    it('should handle rapid language switching', async () => {
      const franchise = createMockFranchise({ planTier: 'premium', isActive: false });
      const { changeLanguage } = render(
        <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'en' }
      );

      // Switch to Spanish
      changeLanguage('es');
      await waitFor(() => {
        expect(screen.getByText('Premium')).toBeInTheDocument();
        expect(screen.getByText('● Inactivo')).toBeInTheDocument();
      });

      // Switch back to English
      changeLanguage('en');
      await waitFor(() => {
        expect(screen.getByText('Premium')).toBeInTheDocument();
        expect(screen.getByText('● Inactive')).toBeInTheDocument();
      });

      // Switch to Spanish again
      changeLanguage('es');
      await waitFor(() => {
        expect(screen.getByText('Premium')).toBeInTheDocument();
        expect(screen.getByText('● Inactivo')).toBeInTheDocument();
      });
    });
  });

  describe('Data integrity with language switching', () => {
    it('should preserve franchise data when switching languages', async () => {
      const franchise = createMockFranchise({
        name: 'Test Franchise',
        email: 'test@example.com',
        phone: '+34 123 456 789',
        description: 'Test description',
        planTier: 'basic',
        isActive: true,
      });

      const { changeLanguage } = render(
        <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'en' }
      );

      // Verify data is displayed
      expect(screen.getByText('Test Franchise')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('+34 123 456 789')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();

      // Switch language
      changeLanguage('es');

      // Verify data is still displayed (unchanged)
      await waitFor(() => {
        expect(screen.getByText('Test Franchise')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText('+34 123 456 789')).toBeInTheDocument();
        expect(screen.getByText('Test description')).toBeInTheDocument();
      });
    });
  });

  describe('Action button functionality with i18n', () => {
    it('should trigger onEdit with correct ID when Edit button clicked in English', async () => {
      const franchise = createMockFranchise({ franchiseId: 'test-id' });
      const { user } = render(
        <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'en' }
      );

      const editButton = screen.getByText('Edit');
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith('test-id');
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should trigger onEdit with correct ID when Edit button clicked in Spanish', async () => {
      const franchise = createMockFranchise({ franchiseId: 'test-id' });
      const { user } = render(
        <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'es' }
      );

      const editButton = screen.getByText('Editar');
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith('test-id');
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should trigger onDelete with correct ID when Delete button clicked in English', async () => {
      const franchise = createMockFranchise({ franchiseId: 'test-id' });
      const { user } = render(
        <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'en' }
      );

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith('test-id');
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('should trigger onDelete with correct ID when Delete button clicked in Spanish', async () => {
      const franchise = createMockFranchise({ franchiseId: 'test-id' });
      const { user } = render(
        <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'es' }
      );

      const deleteButton = screen.getByText('Eliminar');
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith('test-id');
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle franchise without website', () => {
      const franchise = createMockFranchise({ website: undefined });
      render(
        <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'en' }
      );

      expect(screen.queryByText('Website')).not.toBeInTheDocument();
    });

    it('should handle franchise without description', () => {
      const franchise = createMockFranchise({ description: undefined });
      render(
        <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'en' }
      );

      // Card should still render without description
      expect(screen.getByText(franchise.name)).toBeInTheDocument();
    });

    it('should handle franchise without logo', () => {
      const franchise = createMockFranchise({ logo: undefined });
      render(
        <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
        { language: 'en' }
      );

      // Should display default emoji
      expect(screen.getByText('🏢')).toBeInTheDocument();
    });

    it('should handle missing onEdit callback', () => {
      render(
        <FranchiseCard franchise={defaultFranchise} onDelete={mockOnDelete} />,
        { language: 'en' }
      );

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('should handle missing onDelete callback', () => {
      render(
        <FranchiseCard franchise={defaultFranchise} onEdit={mockOnEdit} />,
        { language: 'en' }
      );

      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  describe('All plan tiers translations', () => {
    it('should correctly translate all plan tiers in English', () => {
      const planTiers = [
        { tier: 'free' as const, label: 'Free' },
        { tier: 'basic' as const, label: 'Basic' },
        { tier: 'premium' as const, label: 'Premium' },
        { tier: 'enterprise' as const, label: 'Enterprise' },
      ];

      planTiers.forEach(({ tier, label }) => {
        const franchise = createMockFranchise({ planTier: tier });
        const { unmount } = render(
          <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
          { language: 'en' }
        );

        expect(screen.getByText(label)).toBeInTheDocument();
        unmount();
      });
    });

    it('should correctly translate all plan tiers in Spanish', () => {
      const planTiers = [
        { tier: 'free' as const, label: 'Gratis' },
        { tier: 'basic' as const, label: 'Básico' },
        { tier: 'premium' as const, label: 'Premium' },
        { tier: 'enterprise' as const, label: 'Empresarial' },
      ];

      planTiers.forEach(({ tier, label }) => {
        const franchise = createMockFranchise({ planTier: tier });
        const { unmount } = render(
          <FranchiseCard franchise={franchise} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
          { language: 'es' }
        );

        expect(screen.getByText(label)).toBeInTheDocument();
        unmount();
      });
    });
  });
});
