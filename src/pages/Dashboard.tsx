/**
 * Main dashboard page
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useFranchise } from '@/contexts/FranchiseContext';
import { useBranch } from '@/contexts/BranchContext';
import { useBarber } from '@/contexts/BarberContext';
import { useService } from '@/contexts/ServiceContext';
import { useOffer } from '@/contexts/OfferContext';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { LoadingState } from '@/components/shared/LoadingState';
import { OfferCard } from '@/components/offers/OfferCard';
import { Offer } from '@/types';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { franchises, listFranchises } = useFranchise();
  const { branches, listBranches } = useBranch();
  const { barbers, listBarbers } = useBarber();
  const { services, listServices } = useService();
  const { getActiveOffers } = useOffer();
  const [loading, setLoading] = useState(true);
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);

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

      // Load active offers
      const offers = await getActiveOffers();
      setActiveOffers(offers);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message={t('common.loading')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-3 py-4 md:p-6">
        {/* Header - Mobile optimized */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">
            {t('dashboard.greeting', { name: user?.displayName?.split(' ')[0] || 'User' })}
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Stats - Mobile: 2x2 grid */}
        <div className="mb-6 md:mb-8">
          <DashboardStats
            franchiseCount={franchises?.length || 0}
            branchCount={branches?.length || 0}
            barberCount={barbers?.length || 0}
            serviceCount={services?.length || 0}
          />
        </div>

        {/* Quick Actions - Now mobile-first */}
        <QuickActions />

        {/* Barbers Status and Branches Overview */}
        <div className="mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Barbers Status */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 md:mb-6 px-1">💈 {t('nav.barbers')}</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {barbers && barbers.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {barbers.slice(0, 5).map((barber) => (
                    <div key={barber.barberId} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {barber.photoURL ? (
                            <img src={barber.photoURL} alt={barber.displayName} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                              {barber.displayName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{barber.displayName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {barber.specialties.slice(0, 2).join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${barber.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span className={`text-xs font-medium ${
                            barber.isAvailable ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {barber.isAvailable ? t('barbers.status.available') : t('barbers.status.offline')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <p>{t('barbers.empty')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Branches Overview */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 md:mb-6 px-1">📍 {t('nav.branches')}</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {branches && branches.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {branches.slice(0, 5).map((branch) => (
                    <div key={branch.branchId} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 dark:text-white">{branch.name}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              branch.isActive
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400'
                            }`}>
                              {branch.isActive ? t('common.active') : t('common.inactive')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{branch.city}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{branch.address}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <p>{t('branches.empty')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Services */}
        <div className="mt-6 md:mt-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 md:mb-6 px-1">✂️ {t('nav.services')}</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {services && services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {services.slice(0, 6).map((service) => (
                  <div key={service.serviceId} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{service.name}</h3>
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                        {service.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">⏱️ {service.duration} min</span>
                      <span className="font-bold text-gray-900 dark:text-white">€{(service.price / 100).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <p>{t('services.empty')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Offers */}
        {activeOffers.length > 0 && (
          <div className="mt-6 md:mt-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 md:mb-6 px-1">🎉 {t('offers.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {activeOffers.slice(0, 4).map((offer) => (
                <OfferCard key={offer.offerId} offer={offer} compact={true} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
