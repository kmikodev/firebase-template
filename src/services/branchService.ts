/**
 * Branch Service - Firestore operations for branch management
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Branch } from '../types';

const COLLECTION = 'branches';

export const branchService = {
  /**
   * Get a branch by ID
   */
  async getById(branchId: string): Promise<Branch | null> {
    const docRef = doc(db, COLLECTION, branchId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return { branchId: docSnap.id, ...docSnap.data() } as Branch;
  },

  /**
   * List all branches
   */
  async list(): Promise<Branch[]> {
    const q = query(collection(db, COLLECTION), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      branchId: doc.id,
      ...doc.data(),
    })) as Branch[];
  },

  /**
   * List branches by franchise
   */
  async listByFranchise(franchiseId: string): Promise<Branch[]> {
    const q = query(
      collection(db, COLLECTION),
      where('franchiseId', '==', franchiseId),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      branchId: doc.id,
      ...doc.data(),
    })) as Branch[];
  },
};
