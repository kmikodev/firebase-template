/**
 * Barber card component
 */
import { Barber } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProtectedAction } from '@/components/shared/ProtectedAction';
import { canManageBarber } from '@/lib/permissions';

interface BarberCardProps {
  barber: Barber;
  onEdit?: (barberId: string) => void;
  onDelete?: (barberId: string) => void;
  onToggleAvailability?: (barberId: string, isAvailable: boolean) => void;
}

export function BarberCard({ barber, onEdit, onDelete, onToggleAvailability }: BarberCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        {barber.photoURL ? (
          <img
            src={barber.photoURL}
            alt={barber.displayName}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
            💈
          </div>
        )}

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{barber.displayName}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${barber.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-600">
              {barber.isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>
      </div>

      {barber.bio && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{barber.bio}</p>
      )}

      {barber.specialties.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Specialties:</p>
          <div className="flex flex-wrap gap-2">
            {barber.specialties.map((specialty, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>
      )}

      <ProtectedAction requiredPermission={(claims) => canManageBarber(claims, barber.franchiseId)}>
        <div className="space-y-2 pt-4 border-t border-gray-200">
          {onToggleAvailability && (
            <Button
              size="sm"
              variant={barber.isAvailable ? 'secondary' : 'primary'}
              onClick={() => onToggleAvailability(barber.barberId, !barber.isAvailable)}
              className="w-full"
            >
              {barber.isAvailable ? 'Set Unavailable' : 'Set Available'}
            </Button>
          )}
          <div className="flex gap-2">
            {onEdit && (
              <Button size="sm" variant="ghost" onClick={() => onEdit(barber.barberId)} className="flex-1">
                Edit
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="danger" onClick={() => onDelete(barber.barberId)} className="flex-1">
                Delete
              </Button>
            )}
          </div>
        </div>
      </ProtectedAction>
    </Card>
  );
}
