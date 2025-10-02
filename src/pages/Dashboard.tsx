/**
 * Main dashboard page
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFranchise } from '@/contexts/FranchiseContext';
import { useBranch } from '@/contexts/BranchContext';
import { useBarber } from '@/contexts/BarberContext';
import { useService } from '@/contexts/ServiceContext';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { LoadingState } from '@/components/shared/LoadingState';

export default function Dashboard() {
  const { user } = useAuth();
  const { franchises, listFranchises } = useFranchise();
  const { branches, listBranches } = useBranch();
  const { barbers, listBarbers } = useBarber();
  const { services, listServices } = useService();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        listFranchises(),
        listBranches(),
        listBarbers(),
        listServices(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.displayName}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your business today
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <DashboardStats
            franchiseCount={franchises?.length || 0}
            branchCount={branches?.length || 0}
            barberCount={barbers?.length || 0}
            serviceCount={services?.length || 0}
          />
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Activity Section - Placeholder */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            <p>No recent activity to show</p>
            <p className="text-sm mt-2">Activity tracking coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
