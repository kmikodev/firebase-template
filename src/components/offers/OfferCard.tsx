/**
 * Offer card component
 */
import { Offer } from '@/types';
import { Card } from '@/components/ui/Card';

interface OfferCardProps {
  offer: Offer;
  compact?: boolean;
}

export function OfferCard({ offer, compact = false }: OfferCardProps) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getOfferIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return '💰';
      case 'bogo':
        return '🎁';
      case 'free_service':
        return '✨';
      case 'points_bonus':
        return '⭐';
      default:
        return '🎉';
    }
  };

  const getOfferTypeLabel = (type: string) => {
    switch (type) {
      case 'discount':
        return 'Descuento';
      case 'bogo':
        return '2x1';
      case 'free_service':
        return 'Servicio Gratis';
      case 'points_bonus':
        return 'Puntos Bonus';
      default:
        return type;
    }
  };

  const getDiscountText = () => {
    if (offer.discountPercentage) {
      return `-${offer.discountPercentage}%`;
    }
    if (offer.discountAmount) {
      return `-€${(offer.discountAmount / 100).toFixed(2)}`;
    }
    return null;
  };

  if (compact) {
    return (
      <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 rounded-lg text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{getOfferIcon(offer.type)}</span>
              <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-semibold">
                {getOfferTypeLabel(offer.type)}
              </span>
            </div>
            <h3 className="font-bold text-lg mb-1">{offer.title}</h3>
            <p className="text-sm opacity-90 line-clamp-2">{offer.description}</p>
          </div>
          {getDiscountText() && (
            <div className="ml-3 px-3 py-1 bg-white/20 rounded-lg font-bold text-xl">
              {getDiscountText()}
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs opacity-80">
          <span>Válida hasta: {formatDate(offer.endDate)}</span>
          {offer.code && (
            <span className="px-2 py-1 bg-white/20 rounded font-mono font-semibold">
              {offer.code}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {offer.imageURL && (
        <div className="h-48 bg-gray-200 dark:bg-gray-700">
          <img
            src={offer.imageURL}
            alt={offer.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{getOfferIcon(offer.type)}</span>
            <div>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full font-semibold">
                {getOfferTypeLabel(offer.type)}
              </span>
            </div>
          </div>
          {getDiscountText() && (
            <div className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold text-xl">
              {getDiscountText()}
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {offer.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {offer.description}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
            <span>Válido desde:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatDate(offer.startDate)}
            </span>
          </div>
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
            <span>Válido hasta:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatDate(offer.endDate)}
            </span>
          </div>
          {offer.code && (
            <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
              <span>Código:</span>
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-3 py-1 rounded">
                {offer.code}
              </span>
            </div>
          )}
          {offer.usageLimit && (
            <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
              <span>Usos disponibles:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {offer.usageLimit - offer.usageCount} / {offer.usageLimit}
              </span>
            </div>
          )}
        </div>

        {offer.termsAndConditions && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {offer.termsAndConditions}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
