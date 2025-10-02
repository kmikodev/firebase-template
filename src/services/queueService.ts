/**
 * Queue Service - Client for queue management Cloud Functions
 */

import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  Unsubscribe,
  Timestamp
} from 'firebase/firestore';
import { functions, db } from '../lib/firebase';
import type { QueueTicket } from '../types';

// Re-export for convenience
export type { QueueTicket };

export interface TakeTicketRequest {
  branchId: string;
  serviceId?: string;
  barberId?: string;
}

export interface TakeTicketResponse {
  success: boolean;
  queueId: string;
  position: number;
  message: string;
}

export interface AdvanceQueueRequest {
  branchId: string;
  barberId?: string;
}

export interface AdvanceQueueResponse {
  success: boolean;
  ticket?: {
    queueId: string;
    ticketNumber: string;
    userId: string;
    position: number;
  };
  message?: string;
}

export interface MarkArrivalRequest {
  queueId: string;
}

export interface MarkArrivalResponse {
  success: boolean;
  message: string;
}

/**
 * Cloud Functions callable references
 */
const takeTicketFn = httpsCallable<TakeTicketRequest, TakeTicketResponse>(functions, 'takeTicket');
const advanceQueueFn = httpsCallable<AdvanceQueueRequest, AdvanceQueueResponse>(functions, 'advanceQueue');
const markArrivalFn = httpsCallable<MarkArrivalRequest, MarkArrivalResponse>(functions, 'markArrival');

/**
 * Take a queue ticket
 */
export async function takeTicket(data: TakeTicketRequest): Promise<TakeTicketResponse> {
  try {
    const result: HttpsCallableResult<TakeTicketResponse> = await takeTicketFn(data);
    return result.data;
  } catch (error: any) {
    console.error('Error taking ticket:', error);
    throw new Error(error.message || 'Failed to take ticket');
  }
}

/**
 * Advance queue - Call next client (barber action)
 */
export async function advanceQueue(data: AdvanceQueueRequest): Promise<AdvanceQueueResponse> {
  try {
    const result: HttpsCallableResult<AdvanceQueueResponse> = await advanceQueueFn(data);
    return result.data;
  } catch (error: any) {
    console.error('Error advancing queue:', error);
    throw new Error(error.message || 'Failed to advance queue');
  }
}

/**
 * Mark arrival at branch
 */
export async function markArrival(data: MarkArrivalRequest): Promise<MarkArrivalResponse> {
  try {
    const result: HttpsCallableResult<MarkArrivalResponse> = await markArrivalFn(data);
    return result.data;
  } catch (error: any) {
    console.error('Error marking arrival:', error);
    throw new Error(error.message || 'Failed to mark arrival');
  }
}

/**
 * Get user's active ticket at a branch
 */
export async function getUserActiveTicket(userId: string, branchId: string): Promise<QueueTicket | null> {
  try {
    const q = query(
      collection(db, 'queues'),
      where('userId', '==', userId),
      where('branchId', '==', branchId),
      where('status', 'in', ['waiting', 'notified', 'arrived', 'in_service'])
    );

    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          unsubscribe();
          if (snapshot.empty) {
            resolve(null);
          } else {
            resolve(snapshot.docs[0].data() as QueueTicket);
          }
        },
        (error) => {
          unsubscribe();
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error('Error getting user active ticket:', error);
    return null;
  }
}

/**
 * Get active queue for a branch (real-time)
 */
export function subscribeToQueueByBranch(
  branchId: string,
  onUpdate: (tickets: QueueTicket[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'queues'),
    where('branchId', '==', branchId),
    where('status', 'in', ['waiting', 'notified', 'arrived', 'in_service']),
    orderBy('position', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const tickets = snapshot.docs.map(doc => doc.data() as QueueTicket);
      onUpdate(tickets);
    },
    (error) => {
      console.error('Error subscribing to queue:', error);
      onError?.(error);
    }
  );
}

/**
 * Get specific ticket by ID (real-time)
 */
export function subscribeToTicket(
  queueId: string,
  onUpdate: (ticket: QueueTicket | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = doc(db, 'queues', queueId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as QueueTicket);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error('Error subscribing to ticket:', error);
      onError?.(error);
    }
  );
}

/**
 * Get ticket details (one-time read)
 */
export async function getTicket(queueId: string): Promise<QueueTicket | null> {
  try {
    const docRef = doc(db, 'queues', queueId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as QueueTicket;
    }

    return null;
  } catch (error) {
    console.error('Error getting ticket:', error);
    return null;
  }
}

/**
 * Calculate time remaining on timer
 */
export function getTimeRemaining(timerExpiry: Timestamp | null): number {
  if (!timerExpiry) return 0;

  const expiryMs = timerExpiry.toMillis();
  const nowMs = Date.now();
  const remaining = expiryMs - nowMs;

  return Math.max(0, Math.floor(remaining / 1000)); // seconds
}

/**
 * Format time remaining as MM:SS
 */
export function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
