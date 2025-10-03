import { Gift } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoyaltyCard from '../components/loyalty/LoyaltyCard';

export default function LoyaltyPage() {
  const { user } = useAuth();

  // For now, use a default franchiseId. In production, get from user's profile or context
  const franchiseId = user?.franchiseId || 'default-franchise';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Mi Tarjeta de Fidelización
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Acumula sellos con cada servicio y obtén cortes gratis
        </p>
      </div>

      {/* Loyalty Card */}
      <LoyaltyCard franchiseId={franchiseId} />
    </div>
  );
}
