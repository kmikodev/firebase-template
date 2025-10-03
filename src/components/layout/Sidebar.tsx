/**
 * Sidebar navigation component
 */
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

export function Sidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, customClaims, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinks = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: '📊' },
    { path: '/franchises', label: t('nav.franchises'), icon: '🏢', roles: ['super_admin', 'franchise_owner'] },
    { path: '/branches', label: t('nav.branches'), icon: '📍', roles: ['super_admin', 'franchise_owner', 'admin'] },
    { path: '/admin/barbers', label: t('barbers.add'), icon: '👨‍💼', roles: ['super_admin'] },
    { path: '/barbers', label: t('nav.barbers'), icon: '💈', roles: ['super_admin', 'franchise_owner', 'admin'] },
    { path: '/services', label: t('nav.services'), icon: '✂️', roles: ['super_admin', 'franchise_owner', 'admin'] },
    { path: '/offers', label: t('nav.offers'), icon: '🎉', roles: ['super_admin', 'franchise_owner', 'admin'] },
    { path: '/queue', label: t('nav.queue'), icon: '🎫', roles: ['super_admin', 'franchise_owner', 'admin', 'barber'] },
    { path: '/barber-queue', label: t('nav.myQueue'), icon: '💈', roles: ['barber'] },
    { path: '/client-queue', label: t('nav.myTickets'), icon: '🎟️', roles: ['client', 'guest'] },
    { path: '/loyalty', label: t('nav.loyalty'), icon: '🎁' },
    { path: '/profile', label: t('nav.profile'), icon: '👤' },
  ];

  const visibleLinks = navLinks.filter(link => {
    if (!link.roles) return true;
    if (!customClaims) return true;
    return link.roles.includes(customClaims.role);
  });

  if (!user) return null;

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 shadow-md border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between h-16 px-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white">
            <span className="text-2xl">💈</span>
            <span>BarberApp</span>
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-70 z-40 mt-16"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white dark:bg-gray-900 shadow-2xl border-r border-gray-200 dark:border-gray-800 z-50
          transition-all duration-300 ease-in-out
          lg:top-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
          mt-16 lg:mt-0
        `}
      >
        {/* Desktop Logo & Collapse Button */}
        <div className="hidden lg:flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white">
              <span className="text-2xl">💈</span>
              <span>BarberApp</span>
            </Link>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
              title={collapsed ? 'Expandir' : 'Colapsar'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {collapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {visibleLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-colors
                  ${isActive(link.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? link.label : ''}
              >
                <span className="text-xl">{link.icon}</span>
                {!collapsed && <span>{link.label}</span>}
              </Link>
            ))}
          </div>
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-300 dark:ring-gray-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold flex-shrink-0">
                {user.displayName?.charAt(0).toUpperCase()}
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">{user.displayName}</div>
                <div className="text-gray-600 dark:text-gray-400 text-xs capitalize truncate">
                  {customClaims?.role || 'user'}
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <>
              <div className="flex items-center justify-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                <LanguageSwitcher />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full mt-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {t('nav.logout')}
              </Button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
