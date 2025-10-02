/**
 * Main navigation bar component
 */
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, customClaims, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/franchises', label: 'Franchises', icon: '🏢', roles: ['super_admin', 'franchise_owner'] },
    { path: '/branches', label: 'Branches', icon: '📍', roles: ['super_admin', 'franchise_owner', 'admin'] },
    { path: '/admin/barbers', label: 'Crear Barberos', icon: '👨‍💼', roles: ['super_admin'] },
    { path: '/barbers', label: 'Barbers', icon: '💈', roles: ['super_admin', 'franchise_owner', 'admin'] },
    { path: '/services', label: 'Services', icon: '✂️', roles: ['super_admin', 'franchise_owner', 'admin'] },
    { path: '/queue', label: 'Queue', icon: '🎫', roles: ['super_admin', 'franchise_owner', 'admin', 'barber'] },
    { path: '/barber-queue', label: 'Mi Cola', icon: '💈', roles: ['barber'] },
    { path: '/client-queue', label: 'Mis Turnos', icon: '🎟️', roles: ['client', 'guest'] },
    { path: '/profile', label: 'Perfil', icon: '👤' },
  ];

  const visibleLinks = navLinks.filter(link => {
    if (!link.roles) return true;
    // Si no hay customClaims (usuario nuevo/guest), mostrar todos los links
    if (!customClaims) return true;
    return link.roles.includes(customClaims.role);
  });

  if (!user) return null;

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-gray-900 hover:text-blue-600 transition-colors">
            <span className="text-2xl">💈</span>
            <span>BarberApp</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {visibleLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-sm text-right">
              <div className="font-medium text-gray-900">{user.displayName}</div>
              <div className="text-gray-500 text-xs capitalize">{customClaims?.role || 'user'}</div>
            </div>
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-2">
              {visibleLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-gray-200 mt-2 pt-2">
                <div className="px-4 py-2 text-sm">
                  <div className="font-medium text-gray-900">{user.displayName}</div>
                  <div className="text-gray-500 text-xs capitalize">{customClaims?.role || 'user'}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full mt-2">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
