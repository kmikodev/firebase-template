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
      // Redirigir inmediatamente sin mostrar mensaje
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
