/**
 * Offer Context - Manages offers and promotions
 */
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Offer } from '@/types';
import { useAuth } from './AuthContext';

interface OfferContextType {
  offers: Offer[] | null;
  loading: boolean;
  error: string | null;
  listOffers: () => Promise<void>;
  getOffer: (offerId: string) => Promise<Offer | null>;
  createOffer: (data: Omit<Offer, 'offerId' | 'usageCount' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateOffer: (offerId: string, data: Partial<Offer>) => Promise<void>;
  deleteOffer: (offerId: string) => Promise<void>;
  getActiveOffers: (franchiseId?: string, branchId?: string) => Promise<Offer[]>;
}

const OfferContext = createContext<OfferContextType | undefined>(undefined);

export function OfferProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'offers'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const offersList = snapshot.docs.map(doc => ({
        offerId: doc.id,
        ...doc.data(),
      })) as Offer[];
      setOffers(offersList);
    } catch (err: any) {
      console.error('Error listing offers:', err);
      setError(err.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, []);

  const getOffer = useCallback(async (offerId: string): Promise<Offer | null> => {
    try {
      const docRef = doc(db, 'offers', offerId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return {
          offerId: docSnap.id,
          ...docSnap.data(),
        } as Offer;
      }
      return null;
    } catch (err: any) {
      console.error('Error getting offer:', err);
      throw new Error(err.message || 'Failed to get offer');
    }
  }, []);

  const createOffer = useCallback(async (data: Omit<Offer, 'offerId' | 'usageCount' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const docRef = await addDoc(collection(db, 'offers'), {
        ...data,
        usageCount: 0,
        createdBy: user.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await listOffers();
      return docRef.id;
    } catch (err: any) {
      console.error('Error creating offer:', err);
      throw new Error(err.message || 'Failed to create offer');
    }
  }, [user, listOffers]);

  const updateOffer = useCallback(async (offerId: string, data: Partial<Offer>) => {
    try {
      const docRef = doc(db, 'offers', offerId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      await listOffers();
    } catch (err: any) {
      console.error('Error updating offer:', err);
      throw new Error(err.message || 'Failed to update offer');
    }
  }, [listOffers]);

  const deleteOffer = useCallback(async (offerId: string) => {
    try {
      await deleteDoc(doc(db, 'offers', offerId));
      await listOffers();
    } catch (err: any) {
      console.error('Error deleting offer:', err);
      throw new Error(err.message || 'Failed to delete offer');
    }
  }, [listOffers]);

  const getActiveOffers = useCallback(async (franchiseId?: string, branchId?: string): Promise<Offer[]> => {
    try {
      const now = Timestamp.now();
      let q = query(
        collection(db, 'offers'),
        where('isActive', '==', true),
        where('startDate', '<=', now),
        where('endDate', '>=', now),
        orderBy('startDate', 'desc')
      );

      if (franchiseId) {
        q = query(q, where('franchiseId', '==', franchiseId));
      }

      const snapshot = await getDocs(q);
      let activeOffers = snapshot.docs.map(doc => ({
        offerId: doc.id,
        ...doc.data(),
      })) as Offer[];

      // Filter by branchId if provided (can't use multiple where on non-indexed fields)
      if (branchId) {
        activeOffers = activeOffers.filter(offer =>
          !offer.branchId || offer.branchId === branchId
        );
      }

      return activeOffers;
    } catch (err: any) {
      console.error('Error getting active offers:', err);
      throw new Error(err.message || 'Failed to get active offers');
    }
  }, []);

  const value: OfferContextType = {
    offers,
    loading,
    error,
    listOffers,
    getOffer,
    createOffer,
    updateOffer,
    deleteOffer,
    getActiveOffers,
  };

  return <OfferContext.Provider value={value}>{children}</OfferContext.Provider>;
}

export function useOffer() {
  const context = useContext(OfferContext);
  if (context === undefined) {
    throw new Error('useOffer must be used within an OfferProvider');
  }
  return context;
}
