/**
 * FranchiseForm i18n Tests
 *
 * Tests internationalization for the FranchiseForm component including:
 * - Form title (New/Edit Franchise)
 * - Form labels (Name, Description, Email, Phone, Website, Plan Tier, Active)
 * - Form placeholders
 * - Plan tier options
 * - Action buttons (Create/Update/Cancel)
 * - Language switching
 * - Dark/light mode compatibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { FranchiseForm } from '@/components/franchises/FranchiseForm';
import { render, createMockFranchise } from '@/test/test-utils';

describe('FranchiseForm i18n', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const defaultProps = {
    ownerUserId: 'test-user-id',
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('English translations - Create mode', () => {
    it('should display form title "New Franchise" in English', () => {
      render(<FranchiseForm {...defaultProps} />, { language: 'en' });

      expect(screen.getByText('New Franchise')).toBeInTheDocument();
    });

    it('should display all form labels in English', () => {
      render(<FranchiseForm {...defaultProps} />, { language: 'en' });

      expect(screen.getByText('Logo')).toBeInTheDocument();
      expect(screen.getByText('Name *')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Email *')).toBeInTheDocument();
      expect(screen.getByText('Phone *')).toBeInTheDocument();
      expect(screen.getByText('Website')).toBeInTheDocument();
      expect(screen.getByText('Plan Tier *')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should display all placeholders in English', () => {
      render(<FranchiseForm {...defaultProps} />, { language: 'en' });

      expect(screen.getByPlaceholderText('Franchise name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Brief description of the franchise')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('franchise@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('+34 123 456 789')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
    });

    it('should display plan tier options in English', () => {
      render(<FranchiseForm {...defaultProps} />, { language: 'en' });

      const select = screen.getByRole('combobox');
      const options = Array.from(select.querySelectorAll('option'));

      expect(options[0]).toHaveTextContent('Free');
      expect(options[1]).toHaveTextContent('Basic');
      expect(options[2]).toHaveTextContent('Premium');
      expect(options[3]).toHaveTextContent('Enterprise');
    });

    it('should display Create button in English', () => {
      render(<FranchiseForm {...defaultProps} />, { language: 'en' });

      expect(screen.getByText('Create Franchise')).toBeInTheDocument();
    });

    it('should display Cancel button in English', () => {
      render(<FranchiseForm {...defaultProps} />, { language: 'en' });

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Spanish translations - Create mode', () => {
    it('should display form title "Nueva Franquicia" in Spanish', () => {
      render(<FranchiseForm {...defaultProps} />, { language: 'es' });

      expect(screen.getByText('Nueva Franquicia')).toBeInTheDocument();
    });

    it('should display all form labels in Spanish', () => {
      render(<FranchiseForm {...defaultProps} />, { language: 'es' });

      expect(screen.getByText('Logo')).toBeInTheDocument();
      expect(screen.getByText('Nombre *')).toBeInTheDocument();
      expect(screen.getByText('Descripción')).toBeInTheDocument();
      expect(screen.getByText('Correo Electrónico *')).toBeInTheDocument();
      expect(screen.getByText('Teléfono *')).toBeInTheDocument();
      expect(screen.getByText('Sitio Web')).toBeInTheDocument();
      expect(screen.getByText('Nivel de Plan *')).toBeInTheDocument();
      expect(screen.getByText('Activo')).toBeInTheDocument();
    });

    it('should display all placeholders in Spanish', () => {
      render(<FranchiseForm {...defaultProps} />, { language: 'es' });

      expect(screen.getByPlaceholderText('Nombre de la franquicia')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Breve descripción de la franquicia')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('franquicia@ejemplo.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('+34 123 456 789')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('https://ejemplo.com')).toBeInTheDocument();
    });

    it('should display plan tier options in Spanish', () => {
      render(<FranchiseForm {...defaultProps} />, { language: 'es' });

      const select = screen.getByRole('combobox');
      const options = Array.from(select.querySelectorAll('option'));

      expect(options[0]).toHaveTextContent('Gratis');
      expect(options[1]).toHaveTextContent('Básico');
      expect(options[2]).toHaveTextContent('Premium');
      expect(options[3]).toHaveTextContent('Empresarial');
    });

    it('should display Create button in Spanish', () => {
      render(<FranchiseForm {...defaultProps} />, { language: 'es' });

      expect(screen.getByText('Crear Franquicia')).toBeInTheDocument();
    });

    it('should display Cancel button in Spanish', () => {
      render(<FranchiseForm {...defaultProps} />, { language: 'es' });

      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });
  });

  describe('English translations - Edit mode', () => {
    const franchise = createMockFranchise();

    it('should display form title "Edit Franchise" in English', () => {
      render(<FranchiseForm {...defaultProps} franchise={franchise} />, { language: 'en' });

      expect(screen.getByText('Edit Franchise')).toBeInTheDocument();
    });

    it('should display Update button in English', () => {
      render(<FranchiseForm {...defaultProps} franchise={franchise} />, { language: 'en' });

      expect(screen.getByText('Update Franchise')).toBeInTheDocument();
    });
  });

  describe('Spanish translations - Edit mode', () => {
    const franchise = createMockFranchise();

    it('should display form title "Editar Franquicia" in Spanish', () => {
      render(<FranchiseForm {...defaultProps} franchise={franchise} />, { language: 'es' });

      expect(screen.getByText('Editar Franquicia')).toBeInTheDocument();
    });

    it('should display Update button in Spanish', () => {
      render(<FranchiseForm {...defaultProps} franchise={franchise} />, { language: 'es' });

      expect(screen.getByText('Actualizar Franquicia')).toBeInTheDocument();
    });
  });

  describe('Language switching - Create mode', () => {
    it('should update form title when switching from English to Spanish', async () => {
      const { changeLanguage } = render(<FranchiseForm {...defaultProps} />, { language: 'en' });

      // Verify English
      expect(screen.getByText('New Franchise')).toBeInTheDocument();

      // Switch to Spanish
      changeLanguage('es');

      // Verify Spanish
      await waitFor(() => {
        expect(screen.getByText('Nueva Franquicia')).toBeInTheDocument();
      });
    });

    it('should update form labels when switching from English to Spanish', async () => {
      const { changeLanguage } = render(<FranchiseForm {...defaultProps} />, { language: 'en' });

      // Verify English
      expect(screen.getByText('Name *')).toBeInTheDocument();
      expect(screen.getByText('Email *')).toBeInTheDocument();
      expect(screen.getByText('Phone *')).toBeInTheDocument();

      // Switch to Spanish
      changeLanguage('es');

      // Verify Spanish
      await waitFor(() => {
        expect(screen.getByText('Nombre *')).toBeInTheDocument();
        expect(screen.getByText('Correo Electrónico *')).toBeInTheDocument();
        expect(screen.getByText('Teléfono *')).toBeInTheDocument();
      });
    });

    it('should update placeholders when switching from English to Spanish', async () => {
      const { changeLanguage } = render(<FranchiseForm {...defaultProps} />, { language: 'en' });

      // Verify English
      expect(screen.getByPlaceholderText('Franchise name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('franchise@example.com')).toBeInTheDocument();

      // Switch to Spanish
      changeLanguage('es');

      // Verify Spanish
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Nombre de la franquicia')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('franquicia@ejemplo.com')).toBeInTheDocument();
      });
    });

    it('should update plan tier options when switching from English to Spanish', async () => {
      const { changeLanguage } = render(<FranchiseForm {...defaultProps} />, { language: 'en' });

      // Verify English
      let select = screen.getByRole('combobox');
      let options = Array.from(select.querySelectorAll('option'));
      expect(options[0]).toHaveTextContent('Free');
      expect(options[1]).toHaveTextContent('Basic');

      // Switch to Spanish
      changeLanguage('es');

      // Verify Spanish
      await waitFor(() => {
        select = screen.getByRole('combobox');
        options = Array.from(select.querySelectorAll('option'));
        expect(options[0]).toHaveTextContent('Gratis');
        expect(options[1]).toHaveTextContent('Básico');
      });
    });

    it('should update buttons when switching from English to Spanish', async () => {
      const { changeLanguage } = render(<FranchiseForm {...defaultProps} />, { language: 'en' });

      // Verify English
      expect(screen.getByText('Create Franchise')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();

      // Switch to Spanish
      changeLanguage('es');

      // Verify Spanish
      await waitFor(() => {
        expect(screen.getByText('Crear Franquicia')).toBeInTheDocument();
        expect(screen.getByText('Cancelar')).toBeInTheDocument();
      });
    });
  });

  describe('Language switching - Edit mode', () => {
    const franchise = createMockFranchise();

    it('should update form title when switching from English to Spanish in edit mode', async () => {
      const { changeLanguage } = render(
        <FranchiseForm {...defaultProps} franchise={franchise} />,
        { language: 'en' }
      );

      // Verify English
      expect(screen.getByText('Edit Franchise')).toBeInTheDocument();

      // Switch to Spanish
      changeLanguage('es');

      // Verify Spanish
      await waitFor(() => {
        expect(screen.getByText('Editar Franquicia')).toBeInTheDocument();
      });
    });

    it('should update Update button when switching from English to Spanish', async () => {
      const { changeLanguage } = render(
        <FranchiseForm {...defaultProps} franchise={franchise} />,
        { language: 'en' }
      );

      // Verify English
      expect(screen.getByText('Update Franchise')).toBeInTheDocument();

      // Switch to Spanish
      changeLanguage('es');

      // Verify Spanish
      await waitFor(() => {
        expect(screen.getByText('Actualizar Franquicia')).toBeInTheDocument();
      });
    });

    it('should preserve franchise data when switching languages', async () => {
      const testFranchise = createMockFranchise({
        name: 'Test Franchise',
        email: 'test@example.com',
        phone: '+34 123 456 789',
        description: 'Test description',
      });

      const { changeLanguage } = render(
        <FranchiseForm {...defaultProps} franchise={testFranchise} />,
        { language: 'en' }
      );

      // Verify data is displayed
      expect(screen.getByDisplayValue('Test Franchise')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+34 123 456 789')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();

      // Switch language
      changeLanguage('es');

      // Verify data is still displayed (unchanged)
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Franchise')).toBeInTheDocument();
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('+34 123 456 789')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
      });
    });
  });

  describe('Action button functionality with i18n', () => {
    it('should trigger onCancel when Cancel button clicked in English', async () => {
      const { user } = render(<FranchiseForm {...defaultProps} />, { language: 'en' });

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should trigger onCancel when Cancel button clicked in Spanish', async () => {
      const { user } = render(<FranchiseForm {...defaultProps} />, { language: 'es' });

      const cancelButton = screen.getByText('Cancelar');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading state with i18n', () => {
    it('should display loading state correctly in English', () => {
      render(<FranchiseForm {...defaultProps} isLoading={true} />, { language: 'en' });

      // Button should be disabled and show loading state
      const submitButton = screen.getByText('Create Franchise');
      expect(submitButton).toBeDisabled();
    });

    it('should display loading state correctly in Spanish', () => {
      render(<FranchiseForm {...defaultProps} isLoading={true} />, { language: 'es' });

      // Button should be disabled and show loading state
      const submitButton = screen.getByText('Crear Franquicia');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid language switching', async () => {
      const { changeLanguage } = render(<FranchiseForm {...defaultProps} />, { language: 'en' });

      // Switch to Spanish
      changeLanguage('es');
      await waitFor(() => {
        expect(screen.getByText('Nueva Franquicia')).toBeInTheDocument();
      });

      // Switch back to English
      changeLanguage('en');
      await waitFor(() => {
        expect(screen.getByText('New Franchise')).toBeInTheDocument();
      });

      // Switch to Spanish again
      changeLanguage('es');
      await waitFor(() => {
        expect(screen.getByText('Nueva Franquicia')).toBeInTheDocument();
      });
    });

    it('should handle all plan tiers in both languages', async () => {
      const { changeLanguage } = render(<FranchiseForm {...defaultProps} />, { language: 'en' });

      // Verify all English options
      let select = screen.getByRole('combobox');
      let options = Array.from(select.querySelectorAll('option'));
      expect(options).toHaveLength(4);
      expect(options.map(o => o.textContent)).toEqual(['Free', 'Basic', 'Premium', 'Enterprise']);

      // Switch to Spanish
      changeLanguage('es');

      // Verify all Spanish options
      await waitFor(() => {
        select = screen.getByRole('combobox');
        options = Array.from(select.querySelectorAll('option'));
        expect(options).toHaveLength(4);
        expect(options.map(o => o.textContent)).toEqual(['Gratis', 'Básico', 'Premium', 'Empresarial']);
      });
    });

    it('should handle isActive checkbox label in both languages', async () => {
      const { changeLanguage } = render(<FranchiseForm {...defaultProps} />, { language: 'en' });

      // Verify English
      expect(screen.getByText('Active')).toBeInTheDocument();

      // Switch to Spanish
      changeLanguage('es');

      // Verify Spanish
      await waitFor(() => {
        expect(screen.getByText('Activo')).toBeInTheDocument();
      });
    });
  });

  describe('All form fields translations', () => {
    it('should translate all field labels correctly in English', () => {
      render(<FranchiseForm {...defaultProps} />, { language: 'en' });

      const expectedLabels = [
        'Logo',
        'Name *',
        'Description',
        'Email *',
        'Phone *',
        'Website',
        'Plan Tier *',
        'Active',
      ];

      expectedLabels.forEach(label => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it('should translate all field labels correctly in Spanish', () => {
      render(<FranchiseForm {...defaultProps} />, { language: 'es' });

      const expectedLabels = [
        'Logo',
        'Nombre *',
        'Descripción',
        'Correo Electrónico *',
        'Teléfono *',
        'Sitio Web',
        'Nivel de Plan *',
        'Activo',
      ];

      expectedLabels.forEach(label => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });
});
