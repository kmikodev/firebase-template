/**
 * Franchise card component
 */
import { Franchise } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProtectedAction } from '@/components/shared/ProtectedAction';
import { canManageFranchise } from '@/lib/permissions';

interface FranchiseCardProps {
  franchise: Franchise;
  onEdit?: (franchiseId: string) => void;
  onDelete?: (franchiseId: string) => void;
}

export function FranchiseCard({ franchise, onEdit, onDelete }: FranchiseCardProps) {
  const planColors = {
    free: 'bg-gray-100 text-gray-800',
    basic: 'bg-blue-100 text-blue-800',
    premium: 'bg-purple-100 text-purple-800',
    enterprise: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        {franchise.logo ? (
          <img src={franchise.logo} alt={franchise.name} className="w-16 h-16 rounded-lg object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-2xl">
            🏢
          </div>
        )}
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${planColors[franchise.planTier]}`}>
          {franchise.planTier}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{franchise.name}</h3>

      {franchise.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{franchise.description}</p>
      )}

      <div className="space-y-1 text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-2">
          <span>📧</span>
          <span>{franchise.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>📞</span>
          <span>{franchise.phone}</span>
        </div>
        {franchise.website && (
          <div className="flex items-center gap-2">
            <span>🌐</span>
            <a href={franchise.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Website
            </a>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <span className={`text-xs font-medium ${franchise.isActive ? 'text-green-600' : 'text-red-600'}`}>
          {franchise.isActive ? '● Active' : '● Inactive'}
        </span>

        <ProtectedAction requiredPermission={(claims) => canManageFranchise(claims, franchise.franchiseId)}>
          <div className="flex gap-2">
            {onEdit && (
              <Button size="sm" variant="ghost" onClick={() => onEdit(franchise.franchiseId)}>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="danger" onClick={() => onDelete(franchise.franchiseId)}>
                Delete
              </Button>
            )}
          </div>
        </ProtectedAction>
      </div>
    </Card>
  );
}
