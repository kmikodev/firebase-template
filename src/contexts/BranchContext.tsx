import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Branch } from '@/types';
import { parseBranch, validateCreateBranch, validateUpdateBranch } from '@/lib/validation';
import { toast } from '@/lib/toast';
import { useAuth } from './AuthContext';

// ========================================
// Types
// ========================================

export interface CreateBranchInput {
  franchiseId: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  phone: string;
  email?: string;
  photo?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  schedule: {
    monday: { isOpen: boolean; open?: string; close?: string; breakStart?: string; breakEnd?: string };
    tuesday: { isOpen: boolean; open?: string; close?: string; breakStart?: string; breakEnd?: string };
    wednesday: { isOpen: boolean; open?: string; close?: string; breakStart?: string; breakEnd?: string };
    thursday: { isOpen: boolean; open?: string; close?: string; breakStart?: string; breakEnd?: string };
    friday: { isOpen: boolean; open?: string; close?: string; breakStart?: string; breakEnd?: string };
    saturday: { isOpen: boolean; open?: string; close?: string; breakStart?: string; breakEnd?: string };
    sunday: { isOpen: boolean; open?: string; close?: string; breakStart?: string; breakEnd?: string };
  };
  isActive: boolean;
}

export interface UpdateBranchInput extends Partial<Omit<CreateBranchInput, 'franchiseId'>> {}

export interface BranchFilters {
  franchiseId?: string;
  city?: string;
  isActive?: boolean;
}

interface BranchContextType {
  // State
  branches: Branch[] | null;
  currentBranch: Branch | null;
  loading: boolean;
  error: Error | null;

  // CRUD Operations
  createBranch: (data: CreateBranchInput) => Promise<Branch>;
  updateBranch: (branchId: string, data: UpdateBranchInput) => Promise<void>;
  deleteBranch: (branchId: string) => Promise<void>;
  getBranch: (branchId: string) => Promise<Branch | null>;
  listBranches: (filters?: BranchFilters) => Promise<Branch[]>;
  listPublicBranches: (city?: string) => Promise<Branch[]>;

  // Utility Operations
  setCurrentBranch: (branchId: string | null) => void;
  refreshBranches: () => Promise<void>;
  uploadPhoto: (branchId: string, file: File) => Promise<string>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

// ========================================
// Provider Component
// ========================================

export function BranchProvider({ children }: { children: ReactNode }) {
  const { customClaims } = useAuth();
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Real-time subscription for current branch
  useEffect(() => {
    if (!currentBranch?.branchId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'branches', currentBranch.branchId),
      (snapshot) => {
        if (snapshot.exists()) {
          const validated = parseBranch(snapshot.data());
          if (validated) {
            setCurrentBranch(validated as Branch);
          }
        }
      },
      (err) => {
        console.error('Branch subscription error:', err);
        setError(err as Error);
      }
    );

    return () => unsubscribe();
  }, [currentBranch?.branchId]);

  // ========================================
  // CRUD Operations
  // ========================================

  const createBranch = async (data: CreateBranchInput): Promise<Branch> => {
    const toastId = toast.loading('Creating branch...');
    setError(null);

    try {
      const validated = validateCreateBranch(data);
      if (!validated.success) {
        throw new Error(validated.error.issues[0].message);
      }

      const branchId = doc(collection(db, 'branches')).id;

      const newBranch = {
        ...validated.data,
        branchId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(doc(db, 'branches', branchId), newBranch);

      setBranches(prev => [...(prev || []), newBranch as Branch]);

      toast.dismiss(toastId);
      toast.success('Branch created successfully!');

      return newBranch as Branch;
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err as Error);
      setError(err as Error);
      throw err;
    }
  };

  const updateBranch = async (branchId: string, data: UpdateBranchInput): Promise<void> => {
    const toastId = toast.loading('Updating branch...');
    setError(null);

    try {
      const validated = validateUpdateBranch(data);
      if (!validated.success) {
        throw new Error(validated.error.issues[0].message);
      }

      const updateData = {
        ...validated.data,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(doc(db, 'branches', branchId), updateData);

      setBranches(prev =>
        prev?.map(b => (b.branchId === branchId ? { ...b, ...updateData } : b)) || null
      );

      if (currentBranch?.branchId === branchId) {
        setCurrentBranch(prev => (prev ? { ...prev, ...updateData } : null));
      }

      toast.dismiss(toastId);
      toast.success('Branch updated successfully!');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err as Error);
      setError(err as Error);
      throw err;
    }
  };

  const deleteBranch = async (branchId: string): Promise<void> => {
    const toastId = toast.loading('Deleting branch...');
    setError(null);

    try {
      await updateDoc(doc(db, 'branches', branchId), {
        isActive: false,
        updatedAt: Timestamp.now(),
      });

      setBranches(prev =>
        prev?.map(b => (b.branchId === branchId ? { ...b, isActive: false } : b)) || null
      );

      if (currentBranch?.branchId === branchId) {
        setCurrentBranch(null);
      }

      toast.dismiss(toastId);
      toast.success('Branch deleted successfully!');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err as Error);
      setError(err as Error);
      throw err;
    }
  };

  const getBranch = async (branchId: string): Promise<Branch | null> => {
    setError(null);

    try {
      const branchDoc = await getDoc(doc(db, 'branches', branchId));

      if (!branchDoc.exists()) {
        return null;
      }

      const validated = parseBranch(branchDoc.data());
      return validated as Branch | null;
    } catch (err) {
      setError(err as Error);
      toast.error(err as Error);
      throw err;
    }
  };

  const listBranches = async (filters?: BranchFilters): Promise<Branch[]> => {
    setLoading(true);
    setError(null);

    try {
      let q = query(collection(db, 'branches'), orderBy('name', 'asc'));

      if (filters?.franchiseId) {
        q = query(q, where('franchiseId', '==', filters.franchiseId));
      }
      if (filters?.city) {
        q = query(q, where('city', '==', filters.city));
      }
      if (filters?.isActive !== undefined) {
        q = query(q, where('isActive', '==', filters.isActive));
      }

      const snapshot = await getDocs(q);
      const branchesList = snapshot.docs
        .map(doc => parseBranch(doc.data()))
        .filter(Boolean) as Branch[];

      setBranches(branchesList);
      return branchesList;
    } catch (err) {
      setError(err as Error);
      toast.error(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const listPublicBranches = async (city?: string): Promise<Branch[]> => {
    setLoading(true);
    setError(null);

    try {
      let q = query(
        collection(db, 'branches'),
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );

      if (city) {
        q = query(q, where('city', '==', city));
      }

      const snapshot = await getDocs(q);
      const branchesList = snapshot.docs
        .map(doc => parseBranch(doc.data()))
        .filter(Boolean) as Branch[];

      return branchesList;
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

  const refreshBranches = async (): Promise<void> => {
    if (customClaims?.franchiseId) {
      await listBranches({ franchiseId: customClaims.franchiseId });
    }
  };

  const uploadPhoto = async (branchId: string, file: File): Promise<string> => {
    const toastId = toast.loading('Uploading photo...');

    try {
      const ext = file.name.split('.').pop();
      const path = `branches/${branchId}/photo.${ext}`;
      const storageRef = ref(storage, path);

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

            await updateDoc(doc(db, 'branches', branchId), {
              photo: downloadURL,
              updatedAt: Timestamp.now(),
            });

            toast.dismiss(toastId);
            toast.success('Photo uploaded successfully!');
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
    branches,
    currentBranch,
    loading,
    error,
    createBranch,
    updateBranch,
    deleteBranch,
    getBranch,
    listBranches,
    listPublicBranches,
    setCurrentBranch,
    refreshBranches,
    uploadPhoto,
  };

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

// ========================================
// Hook
// ========================================

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within BranchProvider');
  }
  return context;
}
