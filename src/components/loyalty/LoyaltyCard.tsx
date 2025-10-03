import { useEffect, useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoyaltyStamp, LoyaltyReward, LoyaltyCustomerSummary } from '../../types';
import { subscribeToUserSummary, getUserStamps, getUserRewards } from '../../services/loyaltyService';
import { Card } from '../ui/Card';
import StampProgress from './StampProgress';
import RewardsList from './RewardsList';

interface LoyaltyCardProps {
  franchiseId: string;
}

export default function LoyaltyCard({ franchiseId }: LoyaltyCardProps) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<LoyaltyCustomerSummary | null>(null);
  const [stamps, setStamps] = useState<LoyaltyStamp[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;
    const unsubscribe = subscribeToUserSummary(user.id, (data) => {
      if (mounted) {
        setSummary(data);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;
    const loadData = async () => {
      try {
        const [stampsData, rewardsData] = await Promise.all([
          getUserStamps(user.id, franchiseId),
          getUserRewards(user.id, franchiseId),
        ]);
        if (mounted) {
          setStamps(stampsData);
          setRewards(rewardsData);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error al cargar datos');
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [user?.id, franchiseId]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  const activeStamps = stamps.filter(s => s.status === 'active').length;
  const franchiseData = summary?.franchises?.[franchiseId];
  const requiredStamps = franchiseData?.currentProgress?.required || 10;
  const progress = (activeStamps / requiredStamps) * 100;

  return (
    <div className="space-y-6">
      {/* Main Card */}
      <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-2 border-indigo-200 dark:border-indigo-800">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Tarjeta de Fidelización
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Acumula sellos y obtén cortes gratis
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-sm">
              <div className="text-xs text-gray-500 dark:text-gray-400">Recompensas</div>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {franchiseData?.totalRewardsGenerated || 0}
              </div>
            </div>
          </div>

          {/* Stamps Progress */}
          <StampProgress
            activeStamps={activeStamps}
            requiredStamps={requiredStamps}
            progress={progress}
          />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">Sellos</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {activeStamps}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">Canjeados</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {franchiseData?.totalRewardsRedeemed || 0}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {franchiseData?.totalStampsEarned || 0}
              </div>
            </div>
          </div>

          {/* Expiration Warning */}
          {stamps.some(s => {
            if (!s.expiresAt) return false;
            const expiryDate = s.expiresAt.toDate();
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return s.status === 'active' && daysUntilExpiry <= 7;
          }) && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Sellos por expirar
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                    Tienes sellos que vencen pronto. ¡Acumula más para conseguir tu recompensa!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Rewards List */}
      <RewardsList
        rewards={rewards}
        franchiseId={franchiseId}
      />
    </div>
  );
}
