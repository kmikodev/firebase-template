/**
 * Barber Service - Frontend service for barber management
 */
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot, Query } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import type { Barber } from '@/types';

/**
 * Create a new barber
 */
export async function createBarber(data: {
  email: string;
  password: string;
  displayName: string;
  franchiseId: string;
  branchId: string;
  specialties?: string[];
  bio?: string;
  photoURL?: string;
}) {
  const createBarberFn = httpsCallable(functions, 'createBarber');
  const result = await createBarberFn(data);
  return result.data;
}

/**
 * Update barber information
 */
export async function updateBarber(barberId: string, updates: Partial<Barber>) {
  const updateBarberFn = httpsCallable(functions, 'updateBarber');
  const result = await updateBarberFn({ barberId, updates });
  return result.data;
}

/**
 * Delete barber (soft delete)
 */
export async function deleteBarber(barberId: string) {
  const deleteBarberFn = httpsCallable(functions, 'deleteBarber');
  const result = await deleteBarberFn({ barberId });
  return result.data;
}

/**
 * Get all barbers (optionally filter by branch)
 */
export async function listBarbers(branchId?: string): Promise<Barber[]> {
  let q: Query;

  if (branchId) {
    q = query(
      collection(db, 'barbers'),
      where('branchId', '==', branchId),
      where('isActive', '==', true)
    );
  } else {
    q = query(
      collection(db, 'barbers'),
      where('isActive', '==', true)
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Barber);
}

/**
 * Get barber by ID
 */
export async function getBarber(barberId: string): Promise<Barber | null> {
  const docRef = doc(db, 'barbers', barberId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as Barber;
}

/**
 * Subscribe to barbers real-time (optionally filter by branch)
 */
export function subscribeToBarbers(
  callback: (barbers: Barber[]) => void,
  branchId?: string
) {
  let q: Query;

  if (branchId) {
    q = query(
      collection(db, 'barbers'),
      where('branchId', '==', branchId),
      where('isActive', '==', true)
    );
  } else {
    q = query(
      collection(db, 'barbers'),
      where('isActive', '==', true)
    );
  }

  return onSnapshot(q, (snapshot) => {
    const barbers = snapshot.docs.map(doc => doc.data() as Barber);
    callback(barbers);
  });
}

/**
 * Get barbers by franchise
 */
export async function getBarbersByFranchise(franchiseId: string): Promise<Barber[]> {
  const q = query(
    collection(db, 'barbers'),
    where('franchiseId', '==', franchiseId),
    where('isActive', '==', true)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Barber);
}

const barberService = {
  createBarber,
  updateBarber,
  deleteBarber,
  listBarbers,
  getBarber,
  subscribeToBarbers,
  getBarbersByFranchise,
};

export default barberService;
