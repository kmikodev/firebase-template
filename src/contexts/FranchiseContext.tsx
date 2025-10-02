import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Franchise } from '@/types';
import { parseFranchise, validateCreateFranchise, validateUpdateFranchise } from '@/lib/validation';
import { toast } from '@/lib/toast';
import { useAuth } from './AuthContext';

// ========================================
// Types
// ========================================

export interface CreateFranchiseInput {
  name: string;
  ownerUserId: string;
  email: string;
  phone: string;
  logo?: string;
  description?: string;
  website?: string;
  planTier: 'free' | 'basic' | 'premium' | 'enterprise';
  isActive: boolean;
}

export interface UpdateFranchiseInput extends Partial<CreateFranchiseInput> {}

export interface FranchiseFilters {
  ownerUserId?: string;
  planTier?: 'free' | 'basic' | 'premium' | 'enterprise';
  isActive?: boolean;
}

interface FranchiseContextType {
  // State
  franchises: Franchise[] | null;
  currentFranchise: Franchise | null;
  loading: boolean;
  error: Error | null;

  // CRUD Operations
  createFranchise: (data: CreateFranchiseInput) => Promise<Franchise>;
  updateFranchise: (franchiseId: string, data: UpdateFranchiseInput) => Promise<void>;
  deleteFranchise: (franchiseId: string) => Promise<void>;
  getFranchise: (franchiseId: string) => Promise<Franchise | null>;
  listFranchises: (filters?: FranchiseFilters) => Promise<Franchise[]>;

  // Utility Operations
  setCurrentFranchise: (franchiseId: string | null) => void;
  refreshFranchises: () => Promise<void>;
  uploadLogo: (franchiseId: string, file: File) => Promise<string>;
}

const FranchiseContext = createContext<FranchiseContextType | undefined>(undefined);

// ========================================
// Provider Component
// ========================================

export function FranchiseProvider({ children }: { children: ReactNode }) {
  const { user, customClaims } = useAuth();
  const [franchises, setFranchises] = useState<Franchise[] | null>(null);
  const [currentFranchise, setCurrentFranchise] = useState<Franchise | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Real-time subscription for current franchise
  useEffect(() => {
    if (!currentFranchise?.franchiseId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'franchises', currentFranchise.franchiseId),
      (snapshot) => {
        if (snapshot.exists()) {
          const validated = parseFranchise(snapshot.data());
          if (validated) {
            setCurrentFranchise(validated as Franchise);
          }
        }
      },
      (err) => {
        console.error('Franchise subscription error:', err);
        setError(err as Error);
      }
    );

    return () => unsubscribe();
  }, [currentFranchise?.franchiseId]);

  // Load user's franchises on auth change
  useEffect(() => {
    if (!user || !customClaims) return;

    // Super admins can see all franchises
    if (customClaims.role === 'super_admin') {
      listFranchises();
    }
    // Franchise owners see their own franchises
    else if (customClaims.role === 'franchise_owner') {
      listFranchises({ ownerUserId: user.id });
    }
  }, [user, customClaims]);

  // ========================================
  // CRUD Operations
  // ========================================

  const createFranchise = async (data: CreateFranchiseInput): Promise<Franchise> => {
    const toastId = toast.loading('Creating franchise...');
    setError(null);

    try {
      // Validate with Zod
      const validated = validateCreateFranchise(data);
      if (!validated.success) {
        throw new Error(validated.error.issues[0].message);
      }

      // Generate ID
      const franchiseId = doc(collection(db, 'franchises')).id;

      // Prepare data
      const newFranchise = {
        ...validated.data,
        franchiseId,
        stripeAccountId: undefined,
        stripeSubscriptionId: undefined,
        planExpiresAt: undefined,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Write to Firestore
      await setDoc(doc(db, 'franchises', franchiseId), newFranchise);

      // Update local state
      setFranchises(prev => [...(prev || []), newFranchise as Franchise]);

      toast.dismiss(toastId);
      toast.success('Franchise created successfully!');

      return newFranchise as Franchise;
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err as Error);
      setError(err as Error);
      throw err;
    }
  };

  const updateFranchise = async (franchiseId: string, data: UpdateFranchiseInput): Promise<void> => {
    const toastId = toast.loading('Updating franchise...');
    setError(null);

    try {
      // Validate with Zod
      const validated = validateUpdateFranchise(data);
      if (!validated.success) {
        throw new Error(validated.error.issues[0].message);
      }

      // Prepare update data
      const updateData = {
        ...validated.data,
        updatedAt: Timestamp.now(),
      };

      // Update in Firestore
      await updateDoc(doc(db, 'franchises', franchiseId), updateData);

      // Update local state
      setFranchises(prev =>
        prev?.map(f => (f.franchiseId === franchiseId ? { ...f, ...updateData } : f)) || null
      );

      // Update current franchise if it's the one being updated
      if (currentFranchise?.franchiseId === franchiseId) {
        setCurrentFranchise(prev => (prev ? { ...prev, ...updateData } : null));
      }

      toast.dismiss(toastId);
      toast.success('Franchise updated successfully!');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err as Error);
      setError(err as Error);
      throw err;
    }
  };

  const deleteFranchise = async (franchiseId: string): Promise<void> => {
    const toastId = toast.loading('Deleting franchise...');
    setError(null);

    try {
      // Soft delete (set isActive to false)
      await updateDoc(doc(db, 'franchises', franchiseId), {
        isActive: false,
        updatedAt: Timestamp.now(),
      });

      // Update local state
      setFranchises(prev =>
        prev?.map(f => (f.franchiseId === franchiseId ? { ...f, isActive: false } : f)) || null
      );

      // Clear current franchise if it's the one being deleted
      if (currentFranchise?.franchiseId === franchiseId) {
        setCurrentFranchise(null);
      }

      toast.dismiss(toastId);
      toast.success('Franchise deleted successfully!');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err as Error);
      setError(err as Error);
      throw err;
    }
  };

  const getFranchise = async (franchiseId: string): Promise<Franchise | null> => {
    setError(null);

    try {
      const franchiseDoc = await getDoc(doc(db, 'franchises', franchiseId));

      if (!franchiseDoc.exists()) {
        return null;
      }

      const validated = parseFranchise(franchiseDoc.data());
      return validated as Franchise | null;
    } catch (err) {
      setError(err as Error);
      toast.error(err as Error);
      throw err;
    }
  };

  const listFranchises = async (filters?: FranchiseFilters): Promise<Franchise[]> => {
    setLoading(true);
    setError(null);

    try {
      let q = query(collection(db, 'franchises'), orderBy('createdAt', 'desc'));

      // Apply filters
      if (filters?.ownerUserId) {
        q = query(q, where('ownerUserId', '==', filters.ownerUserId));
      }
      if (filters?.planTier) {
        q = query(q, where('planTier', '==', filters.planTier));
      }
      if (filters?.isActive !== undefined) {
        q = query(q, where('isActive', '==', filters.isActive));
      }

      const snapshot = await getDocs(q);
      const franchisesList = snapshot.docs
        .map(doc => parseFranchise(doc.data()))
        .filter(Boolean) as Franchise[];

      setFranchises(franchisesList);
      return franchisesList;
    } catch (err) {
      setError(err as Error);
      toast.error(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // Utility Operations
  // ========================================

  const refreshFranchises = async (): Promise<void> => {
    if (!user || !customClaims) return;

    if (customClaims.role === 'super_admin') {
      await listFranchises();
    } else if (customClaims.role === 'franchise_owner') {
      await listFranchises({ ownerUserId: user.id });
    }
  };

  const uploadLogo = async (franchiseId: string, file: File): Promise<string> => {
    const toastId = toast.loading('Uploading logo...');

    try {
      // Create storage reference
      const ext = file.name.split('.').pop();
      const path = `franchises/${franchiseId}/logo.${ext}`;
      const storageRef = ref(storage, path);

      // Upload file
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          null,
          (err) => {
            toast.dismiss(toastId);
            toast.error('Upload failed');
            reject(err);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Update franchise with logo URL
            await updateDoc(doc(db, 'franchises', franchiseId), {
              logo: downloadURL,
              updatedAt: Timestamp.now(),
            });

            toast.dismiss(toastId);
            toast.success('Logo uploaded successfully!');
            resolve(downloadURL);
          }
        );
      });
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err as Error);
      throw err;
    }
  };

  const value = {
    franchises,
    currentFranchise,
    loading,
    error,
    createFranchise,
    updateFranchise,
    deleteFranchise,
    getFranchise,
    listFranchises,
    setCurrentFranchise,
    refreshFranchises,
    uploadLogo,
  };

  return <FranchiseContext.Provider value={value}>{children}</FranchiseContext.Provider>;
}

// ========================================
// Hook
// ========================================

export function useFranchise() {
  const context = useContext(FranchiseContext);
  if (context === undefined) {
    throw new Error('useFranchise must be used within FranchiseProvider');
  }
  return context;
}
