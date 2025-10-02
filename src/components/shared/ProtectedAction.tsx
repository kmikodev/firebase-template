/**
 * Protected action component that shows/hides based on permissions
 */
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CustomClaims } from '@/types';

interface ProtectedActionProps {
  children: ReactNode;
  requiredPermission: (claims: CustomClaims | null) => boolean;
  fallback?: ReactNode;
}

export function ProtectedAction({
  children,
  requiredPermission,
  fallback = null
}: ProtectedActionProps) {
  const { customClaims } = useAuth();

  if (!customClaims || !requiredPermission(customClaims)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
