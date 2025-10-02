/**
 * useQueue - React hook for real-time queue management
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  QueueTicket,
  takeTicket as takeTicketFn,
  advanceQueue as advanceQueueFn,
  markArrival as markArrivalFn,
  completeTicket as completeTicketFn,
  cancelTicket as cancelTicketFn,
  getUserActiveTicket,
  subscribeToQueueByBranch,
  subscribeToTicket,
  getTimeRemaining,
  formatTimeRemaining,
  TakeTicketRequest,
  AdvanceQueueRequest,
  MarkArrivalRequest,
  CompleteTicketRequest,
  CancelTicketRequest
} from '../services/queueService';

interface UseQueueOptions {
  branchId?: string;
  queueId?: string;
}

interface UseQueueReturn {
  // Current user's ticket
  myTicket: QueueTicket | null;
  myTicketLoading: boolean;

  // All tickets in branch queue
  queueTickets: QueueTicket[];
  queueLoading: boolean;

  // Specific ticket (for tracking)
  ticket: QueueTicket | null;
  ticketLoading: boolean;

  // Timer for current ticket
  timeRemaining: number;
  timeRemainingFormatted: string;

  // Actions
  takeTicket: (data: TakeTicketRequest) => Promise<void>;
  advanceQueue: (data: AdvanceQueueRequest) => Promise<void>;
  markArrival: (data: MarkArrivalRequest) => Promise<void>;
  completeTicket: (data: CompleteTicketRequest) => Promise<void>;
  cancelTicket: (data: CancelTicketRequest) => Promise<void>;

  // Loading states
  taking: boolean;
  advancing: boolean;
  marking: boolean;
  completing: boolean;
  cancelling: boolean;

  // Error state
  error: string | null;
}

/**
 * Hook for queue management with real-time updates
 */
export function useQueue(options: UseQueueOptions = {}): UseQueueReturn {
  const { branchId, queueId } = options;
  const { firebaseUser } = useAuth();

  // State
  const [myTicket, setMyTicket] = useState<QueueTicket | null>(null);
  const [myTicketLoading, setMyTicketLoading] = useState(false);

  const [queueTickets, setQueueTickets] = useState<QueueTicket[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);

  const [ticket, setTicket] = useState<QueueTicket | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);

  const [timeRemaining, setTimeRemaining] = useState(0);

  const [taking, setTaking] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [marking, setMarking] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Get user's active ticket at branch
  useEffect(() => {
    if (!firebaseUser?.uid || !branchId) {
      setMyTicket(null);
      return;
    }

    setMyTicketLoading(true);

    getUserActiveTicket(firebaseUser.uid, branchId)
      .then(setMyTicket)
      .catch((err) => {
        console.error('Error getting user active ticket:', err);
        setError(err.message);
      })
      .finally(() => setMyTicketLoading(false));
  }, [firebaseUser?.uid, branchId]);

  // Subscribe to branch queue (real-time)
  useEffect(() => {
    if (!branchId) {
      setQueueTickets([]);
      return;
    }

    setQueueLoading(true);

    const unsubscribe = subscribeToQueueByBranch(
      branchId,
      (tickets) => {
        setQueueTickets(tickets);
        setQueueLoading(false);
      },
      (err) => {
        console.error('Error subscribing to queue:', err);
        setError(err.message);
        setQueueLoading(false);
      }
    );

    return () => unsubscribe();
  }, [branchId]);

  // Subscribe to specific ticket (real-time)
  useEffect(() => {
    if (!queueId) {
      setTicket(null);
      return;
    }

    setTicketLoading(true);

    const unsubscribe = subscribeToTicket(
      queueId,
      (ticketData) => {
        setTicket(ticketData);
        setTicketLoading(false);
      },
      (err) => {
        console.error('Error subscribing to ticket:', err);
        setError(err.message);
        setTicketLoading(false);
      }
    );

    return () => unsubscribe();
  }, [queueId]);

  // Update timer every second
  useEffect(() => {
    const activeTicket = ticket || myTicket;

    if (!activeTicket?.timerExpiry) {
      setTimeRemaining(0);
      return;
    }

    // Initial calculation
    setTimeRemaining(getTimeRemaining(activeTicket.timerExpiry ?? null));

    // Update every second
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(activeTicket.timerExpiry ?? null);
      setTimeRemaining(remaining);

      // Stop when timer expires
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [ticket, myTicket]);

  // Actions
  const takeTicket = useCallback(async (data: TakeTicketRequest) => {
    setTaking(true);
    setError(null);

    try {
      const result = await takeTicketFn(data);
      console.log('Ticket taken successfully:', result);

      // Refresh user's ticket
      if (firebaseUser?.uid && data.branchId) {
        const newTicket = await getUserActiveTicket(firebaseUser.uid, data.branchId);
        setMyTicket(newTicket);
      }
    } catch (err: any) {
      console.error('Error taking ticket:', err);
      setError(err.message || 'Failed to take ticket');
      throw err;
    } finally {
      setTaking(false);
    }
  }, [firebaseUser?.uid]);

  const advanceQueue = useCallback(async (data: AdvanceQueueRequest) => {
    setAdvancing(true);
    setError(null);

    try {
      const result = await advanceQueueFn(data);
      console.log('Queue advanced successfully:', result);
    } catch (err: any) {
      console.error('Error advancing queue:', err);
      setError(err.message || 'Failed to advance queue');
      throw err;
    } finally {
      setAdvancing(false);
    }
  }, []);

  const markArrival = useCallback(async (data: MarkArrivalRequest) => {
    setMarking(true);
    setError(null);

    try {
      const result = await markArrivalFn(data);
      console.log('Arrival marked successfully:', result);
    } catch (err: any) {
      console.error('Error marking arrival:', err);
      setError(err.message || 'Failed to mark arrival');
      throw err;
    } finally {
      setMarking(false);
    }
  }, []);

  const completeTicket = useCallback(async (data: CompleteTicketRequest) => {
    setCompleting(true);
    setError(null);

    try {
      const result = await completeTicketFn(data);
      console.log('Ticket completed successfully:', result);
    } catch (err: any) {
      console.error('Error completing ticket:', err);
      setError(err.message || 'Failed to complete ticket');
      throw err;
    } finally {
      setCompleting(false);
    }
  }, []);

  const cancelTicket = useCallback(async (data: CancelTicketRequest) => {
    setCancelling(true);
    setError(null);

    try {
      const result = await cancelTicketFn(data);
      console.log('Ticket cancelled successfully:', result);
    } catch (err: any) {
      console.error('Error cancelling ticket:', err);
      setError(err.message || 'Failed to cancel ticket');
      throw err;
    } finally {
      setCancelling(false);
    }
  }, []);

  return {
    // Current user's ticket
    myTicket,
    myTicketLoading,

    // All tickets in branch queue
    queueTickets,
    queueLoading,

    // Specific ticket
    ticket,
    ticketLoading,

    // Timer
    timeRemaining,
    timeRemainingFormatted: formatTimeRemaining(timeRemaining),

    // Actions
    takeTicket,
    advanceQueue,
    markArrival,
    completeTicket,
    cancelTicket,

    // Loading states
    taking,
    advancing,
    marking,
    completing,
    cancelling,

    // Error
    error,
  };
}
