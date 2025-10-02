/**
 * Dashboard quick actions component - Mobile-first design
 */
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ActionButtonProps {
  icon: string;
  title: string;
  onClick: () => void;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'red';
}

function MobileActionButton({ icon, title, onClick, color }: ActionButtonProps) {
  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
    green: 'bg-green-500 hover:bg-green-600 active:bg-green-700',
    purple: 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700',
    orange: 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700',
    pink: 'bg-pink-500 hover:bg-pink-600 active:bg-pink-700',
    red: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color]} text-white rounded-2xl p-6 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-150 flex flex-col items-center justify-center gap-3 min-h-[140px] w-full`}
    >
      <span className="text-5xl">{icon}</span>
      <span className="font-bold text-base text-center leading-tight">{title}</span>
    </button>
  );
}

export function QuickActions() {
  const navigate = useNavigate();
  const { customClaims } = useAuth();

  const canManageFranchises = customClaims?.role === 'super_admin';
  const canManageBranches = customClaims && ['super_admin', 'franchise_owner', 'admin'].includes(customClaims.role);
  const isBarber = customClaims?.role === 'barber';
  const isClient = customClaims && ['client', 'guest'].includes(customClaims.role);

  const adminActions = [
    {
      icon: '🏢',
      title: 'Nueva Franquicia',
      onClick: () => navigate('/franchises/new'),
      color: 'blue' as const,
      show: canManageFranchises,
    },
    {
      icon: '📍',
      title: 'Nueva Sucursal',
      onClick: () => navigate('/branches/new'),
      color: 'green' as const,
      show: canManageBranches,
    },
    {
      icon: '💈',
      title: 'Nuevo Barbero',
      onClick: () => navigate('/admin/barbers'),
      color: 'purple' as const,
      show: canManageBranches,
    },
    {
      icon: '✂️',
      title: 'Nuevo Servicio',
      onClick: () => navigate('/services/new'),
      color: 'orange' as const,
      show: canManageBranches,
    },
    {
      icon: '🎉',
      title: 'Nueva Oferta',
      onClick: () => navigate('/offers/new'),
      color: 'pink' as const,
      show: canManageBranches,
    },
    {
      icon: '🎫',
      title: 'Ver Cola',
      onClick: () => navigate('/queue'),
      color: 'red' as const,
      show: canManageBranches,
    },
  ];

  const barberActions = [
    {
      icon: '💈',
      title: 'Mi Cola',
      onClick: () => navigate('/barber-queue'),
      color: 'purple' as const,
      show: isBarber,
    },
    {
      icon: '👤',
      title: 'Mi Perfil',
      onClick: () => navigate('/profile'),
      color: 'blue' as const,
      show: isBarber,
    },
  ];

  const clientActions = [
    {
      icon: '🎫',
      title: 'Tomar Turno',
      onClick: () => navigate('/take-ticket'),
      color: 'green' as const,
      show: isClient,
    },
    {
      icon: '🎟️',
      title: 'Mis Turnos',
      onClick: () => navigate('/client-queue'),
      color: 'purple' as const,
      show: isClient,
    },
    {
      icon: '👤',
      title: 'Mi Perfil',
      onClick: () => navigate('/profile'),
      color: 'blue' as const,
      show: isClient,
    },
  ];

  const visibleActions = [...adminActions, ...barberActions, ...clientActions].filter(action => action.show);

  if (visibleActions.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 px-1">
        Acciones Rápidas
      </h2>

      {/* Mobile: 2 columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
        {visibleActions.map((action, index) => (
          <MobileActionButton key={index} {...action} />
        ))}
      </div>
    </div>
  );
}
