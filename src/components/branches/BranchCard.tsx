/**
 * Branch card component
 */
import { Branch } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProtectedAction } from '@/components/shared/ProtectedAction';
import { canManageBranch } from '@/lib/permissions';

interface BranchCardProps {
  branch: Branch;
  onEdit?: (branchId: string) => void;
  onDelete?: (branchId: string) => void;
}

export function BranchCard({ branch, onEdit, onDelete }: BranchCardProps) {
  const isOpenNow = () => {
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof branch.schedule;
    const daySchedule = branch.schedule[day];

    if (!daySchedule.isOpen) return false;

    const currentTime = now.toTimeString().slice(0, 5);
    return currentTime >= (daySchedule.open || '') && currentTime <= (daySchedule.close || '');
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      {branch.photo && (
        <img src={branch.photo} alt={branch.name} className="w-full h-40 object-cover rounded-lg mb-4" />
      )}

      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          isOpenNow() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isOpenNow() ? '● Open' : 'Closed'}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-start gap-2">
          <span>📍</span>
          <div>
            <p>{branch.address}</p>
            <p>{branch.city}, {branch.province} {branch.postalCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span>📞</span>
          <span>{branch.phone}</span>
        </div>
        {branch.email && (
          <div className="flex items-center gap-2">
            <span>📧</span>
            <span className="truncate">{branch.email}</span>
          </div>
        )}
      </div>

      <ProtectedAction requiredPermission={(claims) => canManageBranch(claims, branch.franchiseId)}>
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {onEdit && (
            <Button size="sm" variant="ghost" onClick={() => onEdit(branch.branchId)} className="flex-1">
              Edit
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="danger" onClick={() => onDelete(branch.branchId)} className="flex-1">
              Delete
            </Button>
          )}
        </div>
      </ProtectedAction>
    </Card>
  );
}
