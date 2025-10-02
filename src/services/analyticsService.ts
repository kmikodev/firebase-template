/**
 * Analytics Service - Firebase Analytics integration
 */
import { logEvent } from 'firebase/analytics';
import { analytics } from '@/lib/firebase';

export const analyticsService = {
  // Queue Events
  trackTicketTaken(branchId: string, ticketNumber: string, position: number) {
    if (!analytics) return;

    logEvent(analytics, 'ticket_taken', {
      branch_id: branchId,
      ticket_number: ticketNumber,
      position,
      timestamp: Date.now(),
    });
  },

  trackTicketCancelled(queueId: string, reason: string) {
    if (!analytics) return;

    logEvent(analytics, 'ticket_cancelled', {
      queue_id: queueId,
      reason,
      timestamp: Date.now(),
    });
  },

  trackTicketCompleted(queueId: string, durationMinutes?: number) {
    if (!analytics) return;

    logEvent(analytics, 'ticket_completed', {
      queue_id: queueId,
      duration_minutes: durationMinutes || 0,
      timestamp: Date.now(),
    });
  },

  trackArrivalMarked(queueId: string, waitTimeMinutes: number) {
    if (!analytics) return;

    logEvent(analytics, 'arrival_marked', {
      queue_id: queueId,
      wait_time_minutes: waitTimeMinutes,
      timestamp: Date.now(),
    });
  },

  trackQueueAdvanced(branchId: string, queueLength: number) {
    if (!analytics) return;

    logEvent(analytics, 'queue_advanced', {
      branch_id: branchId,
      queue_length: queueLength,
      timestamp: Date.now(),
    });
  },

  // User Events
  trackSignUp(method: string, role?: string) {
    if (!analytics) return;

    logEvent(analytics, 'sign_up', {
      method,
      role: role || 'client',
      timestamp: Date.now(),
    });
  },

  trackLogin(method: string, role?: string) {
    if (!analytics) return;

    logEvent(analytics, 'login', {
      method,
      role: role || 'client',
      timestamp: Date.now(),
    });
  },

  trackLogout() {
    if (!analytics) return;

    logEvent(analytics, 'logout', {
      timestamp: Date.now(),
    });
  },

  // Notification Events
  trackNotificationReceived(type: string, title: string) {
    if (!analytics) return;

    logEvent(analytics, 'notification_received', {
      notification_type: type,
      title,
      timestamp: Date.now(),
    });
  },

  trackNotificationClicked(type: string, title: string) {
    if (!analytics) return;

    logEvent(analytics, 'notification_clicked', {
      notification_type: type,
      title,
      timestamp: Date.now(),
    });
  },

  trackNotificationPermissionGranted() {
    if (!analytics) return;

    logEvent(analytics, 'notification_permission_granted', {
      timestamp: Date.now(),
    });
  },

  trackNotificationPermissionDenied() {
    if (!analytics) return;

    logEvent(analytics, 'notification_permission_denied', {
      timestamp: Date.now(),
    });
  },

  // Page Views
  trackPageView(pageName: string, additionalParams?: Record<string, any>) {
    if (!analytics) return;

    logEvent(analytics, 'page_view', {
      page_name: pageName,
      ...additionalParams,
      timestamp: Date.now(),
    });
  },

  // Branch Management
  trackBranchCreated(branchId: string) {
    if (!analytics) return;

    logEvent(analytics, 'branch_created', {
      branch_id: branchId,
      timestamp: Date.now(),
    });
  },

  trackBranchUpdated(branchId: string) {
    if (!analytics) return;

    logEvent(analytics, 'branch_updated', {
      branch_id: branchId,
      timestamp: Date.now(),
    });
  },

  // Barber Management
  trackBarberCreated(barberId: string, branchId: string) {
    if (!analytics) return;

    logEvent(analytics, 'barber_created', {
      barber_id: barberId,
      branch_id: branchId,
      timestamp: Date.now(),
    });
  },

  trackBarberStatusChanged(barberId: string, status: string) {
    if (!analytics) return;

    logEvent(analytics, 'barber_status_changed', {
      barber_id: barberId,
      status,
      timestamp: Date.now(),
    });
  },

  // Service Management
  trackServiceCreated(serviceId: string, branchId: string) {
    if (!analytics) return;

    logEvent(analytics, 'service_created', {
      service_id: serviceId,
      branch_id: branchId,
      timestamp: Date.now(),
    });
  },

  // Loyalty Points
  trackPointsEarned(userId: string, points: number, reason: string) {
    if (!analytics) return;

    logEvent(analytics, 'points_earned', {
      user_id: userId,
      points,
      reason,
      timestamp: Date.now(),
    });
  },

  trackPointsPenalty(userId: string, points: number, reason: string) {
    if (!analytics) return;

    logEvent(analytics, 'points_penalty', {
      user_id: userId,
      points,
      reason,
      timestamp: Date.now(),
    });
  },

  // Errors
  trackError(error: string, context: string, fatal = false) {
    if (!analytics) return;

    logEvent(analytics, 'exception', {
      description: error,
      fatal,
      context,
      timestamp: Date.now(),
    });
  },

  // Search & Filter
  trackSearch(searchTerm: string, resultsCount: number) {
    if (!analytics) return;

    logEvent(analytics, 'search', {
      search_term: searchTerm,
      results_count: resultsCount,
      timestamp: Date.now(),
    });
  },

  trackFilterApplied(filterType: string, filterValue: string) {
    if (!analytics) return;

    logEvent(analytics, 'filter_applied', {
      filter_type: filterType,
      filter_value: filterValue,
      timestamp: Date.now(),
    });
  },

  // Export
  trackExport(dataType: string, itemCount: number) {
    if (!analytics) return;

    logEvent(analytics, 'data_exported', {
      data_type: dataType,
      item_count: itemCount,
      timestamp: Date.now(),
    });
  },
};
