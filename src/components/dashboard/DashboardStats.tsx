/**
 * Dashboard statistics cards component
 */
import { Card } from '@/components/ui/Card';

interface StatCardProps {
  icon: string;
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ icon, title, value, subtitle, trend, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center text-2xl mb-4`}>
            {icon}
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </Card>
  );
}

interface DashboardStatsProps {
  franchiseCount: number;
  branchCount: number;
  barberCount: number;
  serviceCount: number;
}

export function DashboardStats({ franchiseCount, branchCount, barberCount, serviceCount }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        icon="🏢"
        title="Total Franchises"
        value={franchiseCount}
        subtitle="Active franchises"
        color="blue"
        trend={{ value: 12, isPositive: true }}
      />
      <StatCard
        icon="📍"
        title="Total Branches"
        value={branchCount}
        subtitle="Across all franchises"
        color="green"
        trend={{ value: 8, isPositive: true }}
      />
      <StatCard
        icon="💈"
        title="Total Barbers"
        value={barberCount}
        subtitle="Active professionals"
        color="purple"
        trend={{ value: 5, isPositive: true }}
      />
      <StatCard
        icon="✂️"
        title="Total Services"
        value={serviceCount}
        subtitle="Available services"
        color="orange"
        trend={{ value: 3, isPositive: false }}
      />
    </div>
  );
}
