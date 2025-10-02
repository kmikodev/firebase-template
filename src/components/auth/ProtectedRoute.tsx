import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
  requireAuthenticated?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requireAuthenticated = true,
}: ProtectedRouteProps) {
  const { firebaseUser, customClaims, loading } = useAuth();

  // Mostrar spinner mientras se carga el estado de autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Si requiere autenticación y no hay usuario, redirigir a login
  if (requireAuthenticated && !firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  // Si requiere rol específico, verificar
  if (requiredRole && customClaims) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!allowedRoles.includes(customClaims.role)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página</p>
          <Navigate to="/" replace />
        </div>
      );
    }
  }

  return <>{children}</>;
}
