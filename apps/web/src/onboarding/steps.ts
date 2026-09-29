export interface OnboardingStepMeta {
  key: string;
  label: string;
  path: string;
}

/** Les 6 étapes numérotées de l'indicateur de progression (l'écran Compte
 * précède l'authentification donc n'a pas de "onboardingStep" backend —
 * l'écran Bienvenue suit la complétion donc n'est pas numéroté non plus). */
export const ONBOARDING_STEPS: OnboardingStepMeta[] = [
  { key: 'company', label: 'Entreprise', path: '/onboarding/company' },
  { key: 'activity', label: 'Activité', path: '/onboarding/activity' },
  { key: 'products', label: 'Produits', path: '/onboarding/products' },
  { key: 'team', label: 'Équipe', path: '/onboarding/team' },
  { key: 'review', label: 'Vérification', path: '/onboarding/review' },
];

const DEFAULT_STEP_PATH = ONBOARDING_STEPS[0].path;

/** Utilisé par la reprise (ProtectedRoute) pour renvoyer un utilisateur à
 * l'étape où il s'était arrêté. */
export function pathForOnboardingStep(step: string | null | undefined): string {
  const found = ONBOARDING_STEPS.find((s) => s.key === step);
  return found ? found.path : DEFAULT_STEP_PATH;
}
