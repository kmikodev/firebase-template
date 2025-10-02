/**
 * Dashboard quick actions component
 */
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ActionCardProps {
  icon: string;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function ActionCard({ icon, title, description, buttonLabel, onClick, color }: ActionCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className={`h-2 bg-gradient-to-r ${colorClasses[color]}`}></div>
      <div className="p-6">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <Button onClick={onClick} className="w-full">
          {buttonLabel}
        </Button>
      </div>
    </Card>
  );
}

export function QuickActions() {
  const navigate = useNavigate();
  const { customClaims } = useAuth();

  const canManageFranchises = customClaims?.role === 'super_admin';
  const canManageBranches = customClaims && ['super_admin', 'franchise_owner', 'admin'].includes(customClaims.role);

  const actions = [
    {
      icon: '🏢',
      title: 'New Franchise',
      description: 'Create a new franchise location',
      buttonLabel: 'Add Franchise',
      onClick: () => navigate('/franchises/new'),
      color: 'blue' as const,
      show: canManageFranchises,
    },
    {
      icon: '📍',
      title: 'New Branch',
      description: 'Add a branch to existing franchise',
      buttonLabel: 'Add Branch',
      onClick: () => navigate('/branches/new?franchiseId=TEMP'),
      color: 'green' as const,
      show: canManageBranches,
    },
    {
      icon: '💈',
      title: 'New Barber',
      description: 'Register a new barber professional',
      buttonLabel: 'Add Barber',
      onClick: () => navigate('/barbers/new?franchiseId=TEMP&branchId=TEMP'),
      color: 'purple' as const,
      show: canManageBranches,
    },
    {
      icon: '✂️',
      title: 'New Service',
      description: 'Create a new service offering',
      buttonLabel: 'Add Service',
      onClick: () => navigate('/services/new?franchiseId=TEMP'),
      color: 'orange' as const,
      show: canManageBranches,
    },
  ];

  const visibleActions = actions.filter(action => action.show);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleActions.map((action, index) => (
          <ActionCard key={index} {...action} />
        ))}
      </div>
    </div>
  );
}
