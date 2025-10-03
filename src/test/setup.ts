import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock i18next for testing
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      // Simple translation mock that returns the key
      // For plurals like "franchises.count.total_plural"
      if (key.includes('_plural') && params?.count !== undefined) {
        return key.replace('_plural', '') + `: ${params.count}`;
      }
      // For interpolation like "{{count}}"
      if (params?.count !== undefined) {
        return `${key}: ${params.count}`;
      }
      // For other interpolations
      if (params) {
        let result = key;
        Object.keys(params).forEach((param) => {
          result = result.replace(`{{${param}}}`, params[param]);
        });
        return result;
      }
      return key;
    },
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
  Trans: ({ children }: any) => children,
  I18nextProvider: ({ children }: any) => children,
}));

// Mock Firebase
vi.mock('@/lib/firebase/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
}));

// Mock useNavigate from react-router-dom
vi.mock('react-router-dom', () => {
  const React = require('react');
  return {
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    Link: ({ children, to }: any) => React.createElement('a', { href: to }, children),
    BrowserRouter: ({ children }: any) => children,
  };
});
