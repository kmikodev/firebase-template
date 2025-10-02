/**
 * Mobile floating navigation bar - Bottom navigation
 */
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

export function MobileFloatingNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { customClaims } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  // Admin navigation items
  const adminNavItems = [
    { path: '/dashboard', icon: '📊', label: t('nav.dashboard'), show: true },
    { path: '/queue', icon: '🎫', label: t('nav.queue'), show: customClaims && ['super_admin', 'franchise_owner', 'admin', 'barber'].includes(customClaims.role) },
    { path: '/branches', icon: '📍', label: t('nav.branches'), show: customClaims && ['super_admin', 'franchise_owner', 'admin'].includes(customClaims.role) },
    { path: '/profile', icon: '👤', label: t('nav.profile'), show: true },
  ];

  // Barber navigation items
  const barberNavItems = [
    { path: '/dashboard', icon: '📊', label: t('nav.dashboard'), show: customClaims?.role === 'barber' },
    { path: '/barber-queue', icon: '💈', label: t('nav.myQueue'), show: customClaims?.role === 'barber' },
    { path: '/profile', icon: '👤', label: t('nav.profile'), show: customClaims?.role === 'barber' },
  ];

  // Client navigation items
  const clientNavItems = [
    { path: '/dashboard', icon: '📊', label: t('nav.dashboard'), show: customClaims && ['client', 'guest'].includes(customClaims.role) },
    { path: '/take-ticket', icon: '🎫', label: t('nav.takeTicket'), show: customClaims && ['client', 'guest'].includes(customClaims.role) },
    { path: '/client-queue', icon: '🎟️', label: t('nav.myTickets'), show: customClaims && ['client', 'guest'].includes(customClaims.role) },
    { path: '/profile', icon: '👤', label: t('nav.profile'), show: customClaims && ['client', 'guest'].includes(customClaims.role) },
  ];

  const navItems = [...adminNavItems, ...barberNavItems, ...clientNavItems].filter(item => item.show);

  if (navItems.length === 0) return null;

  return (
    <nav className="mobile-bottom-nav lg:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl">
      <div className="grid grid-cols-4 h-16 safe-area-pb">
        {navItems.slice(0, 4).map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive(item.path)
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
