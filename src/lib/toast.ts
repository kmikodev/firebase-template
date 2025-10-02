/**
 * Toast notification wrapper using Sonner
 */
import { toast as sonnerToast } from 'sonner';

export const toast = {
  /**
   * Show success toast
   */
  success: (message: string) => {
    sonnerToast.success(message);
  },

  /**
   * Show error toast
   */
  error: (error: Error | string) => {
    const message = error instanceof Error ? error.message : error;
    sonnerToast.error(message);
  },

  /**
   * Show loading toast (returns ID for dismissal)
   */
  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  /**
   * Show info toast
   */
  info: (message: string) => {
    sonnerToast.info(message);
  },

  /**
   * Show warning toast
   */
  warning: (message: string) => {
    sonnerToast.warning(message);
  },

  /**
   * Dismiss a specific toast by ID
   */
  dismiss: (id: string | number) => {
    sonnerToast.dismiss(id);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    sonnerToast.dismiss();
  },
};
