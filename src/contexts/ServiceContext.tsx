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
import { db } from '@/lib/firebase';
import { Service } from '@/types';
import { parseService, validateCreateService, validateUpdateService } from '@/lib/validation';
import { toast } from '@/lib/toast';

// ========================================
// Types
// ========================================

export interface CreateServiceInput {
  franchiseId: string;
  name: string;
  description?: string;
  duration: number; // minutes
  price: number; // cents
  category: string;
  isActive: boolean;
}

export interface UpdateServiceInput extends Partial<Omit<CreateServiceInput, 'franchiseId'>> {}

interface ServiceContextType {
  services: Service[] | null;
  servicesByCategory: Record<string, Service[]> | null;
  loading: boolean;
  error: Error | null;
  createService: (data: CreateServiceInput) => Promise<Service>;
  updateService: (serviceId: string, data: UpdateServiceInput) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  getService: (serviceId: string) => Promise<Service | null>;
  listServices: (franchiseId?: string) => Promise<Service[]>;
  getServicesByCategory: (franchiseId: string) => Promise<Record<string, Service[]>>;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

// ========================================
// Provider Component
// ========================================

export function ServiceProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[] | null>(null);
  const [servicesByCategory, setServicesByCategory] = useState<Record<string, Service[]> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error] = useState<Error | null>(null);

  const createService = async (data: CreateServiceInput): Promise<Service> => {
    const toastId = toast.loading('Creating service...');
    try {
      const validated = validateCreateService(data);
      if (!validated.success) throw new Error(validated.error.issues[0].message);

      const serviceId = doc(collection(db, 'services')).id;
      const newService = {
        ...validated.data,
        serviceId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(doc(db, 'services', serviceId), newService);
      setServices(prev => [...(prev || []), newService as Service]);

      toast.dismiss(toastId);
      toast.success('Service created successfully!');
      return newService as Service;
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err as Error);
      throw err;
    }
  };

  const updateService = async (serviceId: string, data: UpdateServiceInput): Promise<void> => {
    const toastId = toast.loading('Updating service...');
    try {
      const validated = validateUpdateService(data);
      if (!validated.success) throw new Error(validated.error.issues[0].message);

      const updateData = { ...validated.data, updatedAt: Timestamp.now() };
      await updateDoc(doc(db, 'services', serviceId), updateData);

      setServices(prev => prev?.map(s => (s.serviceId === serviceId ? { ...s, ...updateData } : s)) || null);

      toast.dismiss(toastId);
      toast.success('Service updated successfully!');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err as Error);
      throw err;
    }
  };

  const deleteService = async (serviceId: string): Promise<void> => {
    const toastId = toast.loading('Deleting service...');
    try {
      await updateDoc(doc(db, 'services', serviceId), {
        isActive: false,
        updatedAt: Timestamp.now(),
      });

      setServices(prev => prev?.map(s => (s.serviceId === serviceId ? { ...s, isActive: false } : s)) || null);

      toast.dismiss(toastId);
      toast.success('Service deleted successfully!');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err as Error);
      throw err;
    }
  };

  const getService = async (serviceId: string): Promise<Service | null> => {
    try {
      const serviceDoc = await getDoc(doc(db, 'services', serviceId));
      if (!serviceDoc.exists()) return null;
      return parseService(serviceDoc.data()) as Service | null;
    } catch (err) {
      toast.error(err as Error);
      throw err;
    }
  };

  const listServices = async (franchiseId?: string): Promise<Service[]> => {
    setLoading(true);
    try {
      let q = query(collection(db, 'services'), orderBy('category', 'asc'), orderBy('name', 'asc'));
      if (franchiseId) {
        q = query(q, where('franchiseId', '==', franchiseId));
      }

      const snapshot = await getDocs(q);
      const servicesList = snapshot.docs.map(doc => parseService(doc.data())).filter(Boolean) as Service[];
      setServices(servicesList);
      return servicesList;
    } catch (err) {
      toast.error(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getServicesByCategory = async (franchiseId: string): Promise<Record<string, Service[]>> => {
    const servicesList = await listServices(franchiseId);

    const grouped = servicesList.reduce((acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    }, {} as Record<string, Service[]>);

    setServicesByCategory(grouped);
    return grouped;
  };

  const value = {
    services,
    servicesByCategory,
    loading,
    error,
    createService,
    updateService,
    deleteService,
    getService,
    listServices,
    getServicesByCategory,
  };

  return <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>;
}

export function useService() {
  const context = useContext(ServiceContext);
  if (!context) throw new Error('useService must be used within ServiceProvider');
  return context;
}
