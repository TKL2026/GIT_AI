import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../hooks/useOrganization';
import { consumePendingPlan, peekPendingPlan } from '../lib/pendingPlan';
import { pathForOnboardingStep } from '../onboarding/steps';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: organization, isLoading: isOrganizationLoading } = useOrganization(isAuthenticated);

  // Lecture seule pendant le rendu (pas d'effet de bord ici — StrictMode
  // peut invoquer le corps du composant plusieurs fois). La consommation
  // réelle (suppression) se fait dans l'effet ci-dessous, après commit.
  // Ne se déclenche qu'une fois l'onboarding terminé et l'accès non
  // verrouillé — jamais en pleine configuration initiale.
  const canRedirectToCheckout = !!organization?.onboardingCompletedAt && !organization.accessLocked;
  const pendingPlanCode = canRedirectToCheckout ? peekPendingPlan() : null;
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (pendingPlanCode && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      consumePendingPlan();
      navigate(`/checkout?plan=${pendingPlanCode}`, { replace: true });
    }
  }, [pendingPlanCode, navigate]);

  if (isLoading) {
    return <p>Chargement...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isOrganizationLoading) {
    return <p>Chargement...</p>;
  }

  // Essai/abonnement verrouillé (essai expiré, OU offre payante choisie à
  // l'inscription jamais payée — AWAITING_PAYMENT) : bloque tout l'espace
  // protégé, y compris l'onboarding lui-même — un utilisateur qui n'a jamais
  // payé ne doit configurer son espace qu'une fois son paiement confirmé.
  // Vérifié AVANT la porte onboarding ci-dessous (ordre important).
  const isSuspendedRoute = location.pathname === '/subscription-expired';
  if (organization?.accessLocked && !isSuspendedRoute) {
    return <Navigate to="/subscription-expired" replace />;
  }

  // Reprise : un onboarding non terminé (organisation créée mais pas encore
  // configurée) renvoie systématiquement vers l'étape en cours plutôt que de
  // laisser l'utilisateur accéder au reste de l'application.
  const isOnboardingRoute = location.pathname.startsWith('/onboarding');
  if (organization && !organization.onboardingCompletedAt && !isOnboardingRoute) {
    return <Navigate to={pathForOnboardingStep(organization.onboardingStep)} replace />;
  }

  // Offre payante choisie avant inscription/connexion (voir pendingPlan.ts) :
  // l'effet ci-dessus va rediriger vers /checkout — évite d'afficher
  // brièvement le Dashboard pendant cette fraction de seconde.
  if (pendingPlanCode) {
    return <p>Chargement...</p>;
  }

  return <>{children}</>;
}
