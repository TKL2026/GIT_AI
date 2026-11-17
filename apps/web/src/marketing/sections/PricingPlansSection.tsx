import { useNavigate } from 'react-router-dom';
import { clearPendingPlan } from '../../lib/pendingPlan';
import { LaunchProgramHero } from './LaunchProgramHero';

export function PricingPlansSection() {
  const navigate = useNavigate();

  // Programme de lancement : pas d'offre payante à retenir — efface toute
  // intention précédente pour ne pas rediriger une nouvelle inscription
  // vers un checkout d'une offre choisie lors d'une session précédente.
  function handleStart() {
    clearPendingPlan();
    navigate('/register');
  }

  return <LaunchProgramHero onStart={handleStart} />;
}
