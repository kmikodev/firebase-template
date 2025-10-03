import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock providers for testing
interface AllTheProvidersProps {
  children: ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Mock data factories for tests
export const createMockFranchise = (overrides = {}) => ({
  franchiseId: 'test-franchise-1',
  ownerUserId: 'test-user-1',
  name: 'Test Franchise',
  description: 'Test Description',
  email: 'test@franchise.com',
  phone: '+34 123 456 789',
  website: 'https://test.com',
  logo: 'https://example.com/logo.png',
  planTier: 'basic' as const,
  isActive: true,
  createdAt: { toDate: () => new Date('2024-01-01') },
  updatedAt: { toDate: () => new Date('2024-01-01') },
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-1',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'franchiseOwner' as const,
  ...overrides,
});
