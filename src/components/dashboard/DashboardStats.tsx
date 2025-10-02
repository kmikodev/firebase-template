/**
 * Dashboard statistics cards component - Mobile-first
 */
import { useTranslation } from 'react-i18next';

interface StatCardProps {
  icon: string;
  title: string;
  value: number | string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ icon, title, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
    green: 'bg-gradient-to-br from-green-500 to-green-600',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl p-4 shadow-lg text-white`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl md:text-4xl">{icon}</span>
        <p className="text-3xl md:text-4xl font-bold">{value}</p>
      </div>
      <h3 className="text-sm md:text-base font-medium opacity-90">{title}</h3>
    </div>
  );
}

interface DashboardStatsProps {
  franchiseCount: number;
  branchCount: number;
  barberCount: number;
  serviceCount: number;
}

export function DashboardStats({ franchiseCount, branchCount, barberCount, serviceCount }: DashboardStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard
        icon="🏢"
        title={t('dashboard.stats.franchises')}
        value={franchiseCount}
        color="blue"
      />
      <StatCard
        icon="📍"
        title={t('dashboard.stats.branches')}
        value={branchCount}
        color="green"
      />
      <StatCard
        icon="💈"
        title={t('dashboard.stats.barbers')}
        value={barberCount}
        color="purple"
      />
      <StatCard
        icon="✂️"
        title={t('dashboard.stats.services')}
        value={serviceCount}
        color="orange"
      />
    </div>
  );
}
