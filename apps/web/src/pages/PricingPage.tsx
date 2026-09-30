import { Navigate } from 'react-router-dom';

/**
 * Les tarifs vivent désormais directement dans la landing page
 * (LandingPage.tsx, section #tarifs) — source unique, pas de duplication.
 * Cette route est conservée pour ne pas casser un lien/favori existant vers
 * /tarifs, mais redirige immédiatement vers l'ancre correspondante.
 */
export function PricingPage() {
  return <Navigate to="/#tarifs" replace />;
}
