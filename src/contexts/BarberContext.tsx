import { createContext, useContext, useState, ReactNode } from 'react';
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
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Barber } from '@/types';
import { parseBarber, validateCreateBarber, validateUpdateBarber } from '@/lib/validation';
import { toast } from '@/lib/toast';

// ========================================
// Types
// ========================================

export interface CreateBarberInput {
  userId: string;
  franchiseId: string;
  branchId: string;
  displayName: string;
  photoURL?: string | null;
  specialties: string[];
  bio?: string;
  schedule: {
    monday: { isWorking: boolean; workStart?: string; workEnd?: string; breakStart?: string; breakEnd?: string };
    tuesday: { isWorking: boolean; workStart?: string; workEnd?: string; breakStart?: string; breakEnd?: string };
    wednesday: { isWorking: boolean; workStart?: string; workEnd?: string; breakStart?: string; breakEnd?: string };
    thursday: { isWorking: boolean; workStart?: string; workEnd?: string; breakStart?: string; breakEnd?: string };
    friday: { isWorking: boolean; workStart?: string; workEnd?: string; breakStart?: string; breakEnd?: string };
    saturday: { isWorking: boolean; workStart?: string; workEnd?: string; breakStart?: string; breakEnd?: string };
    sunday: { isWorking: boolean; workStart?: string; workEnd?: string; breakStart?: string; breakEnd?: string };
  };
  isActive: boolean;
  isAvailable: boolean;
}

export interface UpdateBarberInput extends Partial<Omit<CreateBarberInput, 'userId' | 'franchiseId' | 'branchId'>> {}

interface BarberContextType {
  barbers: Barber[] | null;
  loading: boolean;
  error: Error | null;
  createBarber: (data: CreateBarberInput) => Promise<Barber>;
  updateBarber: (barberId: string, data: UpdateBarberInput) => Promise<void>;
  deleteBarber: (barberId: string) => Promise<void>;
  getBarber: (barberId: string) => Promise<Barber | null>;
  listBarbers: (branchId?: string) => Promise<Barber[]>;
  toggleAvailability: (barberId: string, isAvailable: boolean) => Promise<void>;
  uploadPhoto: (barberId: string, file: File) => Promise<string>;
}

const BarberContext = createContext<BarberContextType | undefined>(undefined);

// ========================================
// Provider Component
// ========================================

export function BarberProvider({ children }: { children: ReactNode }) {
  const [barbers, setBarbers] = useState<Barber[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error] = useState<Error | null>(null);

  const createBarber = async (data: CreateBarberInput): Promise<Barber> => {
    const toastId = toast.loading('Creating barber...');
    try {
      const validated = validateCreateBarber(data);
      if (!validated.success) throw new Error(validated.error.issues[0].message);

      const barberId = doc(collection(db, 'barbers')).id;
      const newBarber = {
        ...validated.data,
        barberId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(doc(db, 'barbers', barberId), newBarber);
      setBarbers(prev => [...(prev || []), newBarber as Barber]);

      toast.dismiss(toastId);
      toast.success('Barber created successfully!');
      return newBarber as Barber;
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err as Error);
      throw err;
    }
  };

  const updateBarber = async (barberId: string, data: UpdateBarberInput): Promise<void> => {
    const toastId = toast.loading('Updating barber...');
    try {
      const validated = validateUpdateBarber(data);
      if (!validated.success) throw new Error(validated.error.issues[0].message);

      const updateData = { ...validated.data, updatedAt: Timestamp.now() };
      await updateDoc(doc(db, 'barbers', barberId), updateData);

      setBarbers(prev => prev?.map(b => (b.barberId === barberId ? { ...b, ...updateData as Partial<Barber> } : b)) || null);

      toast.dismiss(toastId);
      toast.success('Barber updated successfully!');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err as Error);
      throw err;
    }
  };

  const deleteBarber = async (barberId: string): Promise<void> => {
    const toastId = toast.loading('Deleting barber...');
    try {
      await updateDoc(doc(db, 'barbers', barberId), {
        isActive: false,
        updatedAt: Timestamp.now(),
      });

      setBarbers(prev => prev?.map(b => (b.barberId === barberId ? { ...b, isActive: false } : b)) || null);

      toast.dismiss(toastId);
      toast.success('Barber deleted successfully!');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err as Error);
      throw err;
    }
  };

  const getBarber = async (barberId: string): Promise<Barber | null> => {
    try {
      const barberDoc = await getDoc(doc(db, 'barbers', barberId));
      if (!barberDoc.exists()) return null;
      return parseBarber(barberDoc.data()) as Barber | null;
    } catch (err) {
      toast.error(err as Error);
      throw err;
    }
  };

  const listBarbers = async (branchId?: string): Promise<Barber[]> => {
    setLoading(true);
    try {
      let q = query(collection(db, 'barbers'), orderBy('displayName', 'asc'));
      if (branchId) {
        q = query(q, where('branchId', '==', branchId));
      }

      const snapshot = await getDocs(q);
      const barbersList = snapshot.docs.map(doc => parseBarber(doc.data())).filter(Boolean) as Barber[];
      setBarbers(barbersList);
      return barbersList;
    } catch (err) {
      toast.error(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (barberId: string, isAvailable: boolean): Promise<void> => {
    try {
      await updateDoc(doc(db, 'barbers', barberId), {
        isAvailable,
        updatedAt: Timestamp.now(),
      });

      setBarbers(prev => prev?.map(b => (b.barberId === barberId ? { ...b, isAvailable } : b)) || null);
      toast.success(isAvailable ? 'Barber is now available' : 'Barber is now unavailable');
    } catch (err) {
      toast.error(err as Error);
      throw err;
    }
  };

  const uploadPhoto = async (barberId: string, file: File): Promise<string> => {
    const toastId = toast.loading('Uploading photo...');
    try {
      const ext = file.name.split('.').pop();
      const storageRef = ref(storage, `barbers/${barberId}/photo.${ext}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed', null, reject, async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await updateDoc(doc(db, 'barbers', barberId), {
            photoURL: downloadURL,
            updatedAt: Timestamp.now(),
          });
          toast.dismiss(toastId);
          toast.success('Photo uploaded!');
          resolve(downloadURL);
        });
      });
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err as Error);
      throw err;
    }
  };

  const value = {
    barbers,
    loading,
    error,
    createBarber,
    updateBarber,
    deleteBarber,
    getBarber,
    listBarbers,
    toggleAvailability,
    uploadPhoto,
  };

  return <BarberContext.Provider value={value}>{children}</BarberContext.Provider>;
}

export function useBarber() {
  const context = useContext(BarberContext);
  if (!context) throw new Error('useBarber must be used within BarberProvider');
  return context;
}
