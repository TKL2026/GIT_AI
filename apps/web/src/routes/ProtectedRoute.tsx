import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../hooks/useOrganization';
import { pathForOnboardingStep } from '../onboarding/steps';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const { data: organization, isLoading: isOrganizationLoading } = useOrganization(isAuthenticated);

  if (isLoading) {
    return <p>Chargement...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isOrganizationLoading) {
    return <p>Chargement...</p>;
  }

  // Reprise : un onboarding non terminé (organisation créée mais pas encore
  // configurée) renvoie systématiquement vers l'étape en cours plutôt que de
  // laisser l'utilisateur accéder au reste de l'application.
  const isOnboardingRoute = location.pathname.startsWith('/onboarding');
  if (organization && !organization.onboardingCompletedAt && !isOnboardingRoute) {
    return <Navigate to={pathForOnboardingStep(organization.onboardingStep)} replace />;
  }

  // Essai expiré (ou abonnement expiré) : accès à l'espace de travail
  // entièrement bloqué tant qu'aucune offre n'est choisie — les données ne
  // sont jamais supprimées, seule la navigation est redirigée.
  const isSuspendedRoute = location.pathname === '/subscription-expired';
  if (organization?.accessLocked && !isSuspendedRoute) {
    return <Navigate to="/subscription-expired" replace />;
  }

  return <>{children}</>;
}
