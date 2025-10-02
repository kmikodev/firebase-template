/**
 * Queue Service - Firestore operations for queue management
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { QueueTicket, QueueStatus } from '@/types';

const COLLECTION = 'queues';

export const queueService = {
  /**
   * Get a queue ticket by ID
   */
  async getById(queueId: string): Promise<QueueTicket | null> {
    const docRef = doc(db, COLLECTION, queueId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return { queueId: docSnap.id, ...docSnap.data() } as QueueTicket;
  },

  /**
   * List all queue tickets
   */
  async list(): Promise<QueueTicket[]> {
    const q = query(collection(db, COLLECTION), orderBy('position', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      queueId: doc.id,
      ...doc.data(),
    })) as QueueTicket[];
  },

  /**
   * List queue tickets by branch
   */
  async listByBranch(branchId: string): Promise<QueueTicket[]> {
    const q = query(
      collection(db, COLLECTION),
      where('branchId', '==', branchId),
      orderBy('position', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      queueId: doc.id,
      ...doc.data(),
    })) as QueueTicket[];
  },

  /**
   * List queue tickets by user
   */
  async listByUser(userId: string): Promise<QueueTicket[]> {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      queueId: doc.id,
      ...doc.data(),
    })) as QueueTicket[];
  },

  /**
   * List active queue tickets by branch (waiting, notified, arrived)
   */
  async listActiveByBranch(branchId: string): Promise<QueueTicket[]> {
    const q = query(
      collection(db, COLLECTION),
      where('branchId', '==', branchId),
      where('status', 'in', ['waiting', 'notified', 'arrived']),
      orderBy('position', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      queueId: doc.id,
      ...doc.data(),
    })) as QueueTicket[];
  },

  /**
   * Create a new queue ticket
   */
  async create(data: Omit<QueueTicket, 'queueId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();

    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  },

  /**
   * Update a queue ticket
   */
  async update(queueId: string, data: Partial<QueueTicket>): Promise<void> {
    const docRef = doc(db, COLLECTION, queueId);

    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Update ticket status
   */
  async updateStatus(queueId: string, status: QueueStatus, additionalData?: Partial<QueueTicket>): Promise<void> {
    const docRef = doc(db, COLLECTION, queueId);
    const now = Timestamp.now();

    const updateData: any = {
      status,
      updatedAt: now,
      ...additionalData,
    };

    // Add timestamp fields based on status
    if (status === 'arrived') {
      updateData.arrivedAt = now;
    } else if (status === 'in_service') {
      updateData.calledAt = now;
    } else if (status === 'completed') {
      updateData.completedAt = now;
    } else if (status === 'cancelled') {
      updateData.cancelledAt = now;
    } else if (status === 'expired') {
      updateData.expiredAt = now;
    }

    await updateDoc(docRef, updateData);
  },

  /**
   * Delete a queue ticket
   */
  async delete(queueId: string): Promise<void> {
    const docRef = doc(db, COLLECTION, queueId);
    await deleteDoc(docRef);
  },

  /**
   * Get next position number for a branch
   */
  async getNextPosition(branchId: string): Promise<number> {
    const q = query(
      collection(db, COLLECTION),
      where('branchId', '==', branchId),
      where('status', 'in', ['waiting', 'notified', 'arrived']),
      orderBy('position', 'desc')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return 1;
    }

    const lastTicket = snapshot.docs[0].data() as QueueTicket;
    return lastTicket.position + 1;
  },

  /**
   * Generate ticket number
   */
  generateTicketNumber(branchId: string, position: number): string {
    const branchCode = branchId.substring(0, 4).toUpperCase();
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const positionCode = position.toString().padStart(3, '0');

    return `${branchCode}-${dateCode}-${positionCode}`;
  },

  /**
   * Reorder positions after a ticket is removed
   */
  async reorderPositions(branchId: string): Promise<void> {
    const tickets = await this.listActiveByBranch(branchId);

    if (tickets.length === 0) {
      return;
    }

    // Sort by current position
    tickets.sort((a, b) => a.position - b.position);

    // Update positions sequentially
    const batch = writeBatch(db);

    tickets.forEach((ticket, index) => {
      const newPosition = index + 1;
      if (ticket.position !== newPosition) {
        const docRef = doc(db, COLLECTION, ticket.queueId);
        batch.update(docRef, { position: newPosition, updatedAt: Timestamp.now() });
      }
    });

    await batch.commit();
  },

  /**
   * Calculate estimated wait time
   */
  async calculateEstimatedWaitTime(_branchId: string, position: number): Promise<number> {
    // Simple estimation: 15 minutes per person ahead in queue
    const AVERAGE_SERVICE_TIME = 15; // minutes

    const peopleAhead = position - 1;
    return peopleAhead * AVERAGE_SERVICE_TIME;
  },
};
