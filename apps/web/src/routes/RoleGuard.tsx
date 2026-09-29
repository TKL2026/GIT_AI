import type { Role } from '@copilote/shared';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { hasRole } from '../auth/roles';

export function RoleGuard({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();

  if (!hasRole(user, roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
