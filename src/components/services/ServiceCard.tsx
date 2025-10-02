/**
 * Service card component
 */
import { Service } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProtectedAction } from '@/components/shared/ProtectedAction';
import { canManageService } from '@/lib/permissions';

interface ServiceCardProps {
  service: Service;
  onEdit?: (serviceId: string) => void;
  onDelete?: (serviceId: string) => void;
}

export function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{service.name}</h3>
          <span className="inline-block mt-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
            {service.category}
          </span>
        </div>
      </div>

      {service.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{service.description}</p>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <span>⏱️</span>
            <span>{formatDuration(service.duration)}</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
            <span>💰</span>
            <span>{formatPrice(service.price)}</span>
          </div>
        </div>
      </div>

      <ProtectedAction requiredPermission={(claims) => canManageService(claims, service.franchiseId)}>
        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          {onEdit && (
            <Button size="sm" variant="ghost" onClick={() => onEdit(service.serviceId)} className="flex-1">
              Edit
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="danger" onClick={() => onDelete(service.serviceId)} className="flex-1">
              Delete
            </Button>
          )}
        </div>
      </ProtectedAction>
    </Card>
  );
}
