import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext';

/**
 * Non authentifié → /admin/login. Il n'y a pas de "mauvais rôle" possible
 * ici une fois authentifié : PlatformAdmin est une identité séparée de
 * User/Role, donc toute session admin valide est par construction un
 * PLATFORM_ADMIN (section 4 : jamais OWNER = PLATFORM_ADMIN).
 */
export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return <p>Chargement...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
