import { useState } from 'react';
import { Gift, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { LoyaltyReward } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import RedeemRewardModal from './RedeemRewardModal';

interface RewardsListProps {
  rewards: LoyaltyReward[];
  franchiseId?: string;
}

export default function RewardsList({ rewards }: RewardsListProps) {
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  const activeRewards = rewards.filter(r => r.status === 'active' || r.status === 'generated');
  const redeemedRewards = rewards.filter(r => r.status === 'redeemed');

  const getStatusBadge = (status: LoyaltyReward['status']) => {
    switch (status) {
      case 'active':
      case 'generated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            <CheckCircle className="w-3 h-3" />
            Disponible
          </span>
        );
      case 'in_use':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            <Clock className="w-3 h-3" />
            En uso
          </span>
        );
      case 'redeemed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            Canjeado
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            <AlertCircle className="w-3 h-3" />
            Expirado
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const getDaysUntilExpiry = (expiresAt: Date | null) => {
    if (!expiresAt) return null;
    const days = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (rewards.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Gift className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          Aún no tienes recompensas. ¡Sigue acumulando sellos!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Rewards */}
      {activeRewards.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Recompensas Disponibles ({activeRewards.length})
          </h3>
          <div className="space-y-3">
            {activeRewards.map((reward) => {
              const expiryDate = reward.expiresAt ? reward.expiresAt.toDate() : null;
              const daysLeft = getDaysUntilExpiry(expiryDate);
              return (
                <Card key={reward.rewardId} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Corte Gratis
                        </h4>
                        {getStatusBadge(reward.status)}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Código: <span className="font-mono font-semibold">{reward.code}</span></span>
                        {expiryDate && (
                          <>
                            <span>•</span>
                            <span>Expira: {formatDate(expiryDate)}</span>
                          </>
                        )}
                      </div>

                      {daysLeft !== null && daysLeft <= 7 && (
                        <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                          <Clock className="w-3 h-3" />
                          Expira en {daysLeft} {daysLeft === 1 ? 'día' : 'días'}
                        </div>
                      )}
                    </div>

                    {reward.status === 'active' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowRedeemModal(true)}
                      >
                        Usar
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Redeemed History */}
      {redeemedRewards.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Historial de Recompensas ({redeemedRewards.length})
          </h3>
          <div className="space-y-2">
            {redeemedRewards.map((reward) => (
              <Card key={reward.rewardId} className="p-3 opacity-75">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Gift className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Corte Gratis
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Canjeado: {reward.redeemedAt ? formatDate(reward.redeemedAt.toDate()) : '-'}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(reward.status)}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Redeem Modal */}
      {showRedeemModal && (
        <RedeemRewardModal
          onClose={() => setShowRedeemModal(false)}
        />
      )}
    </div>
  );
}
