/**
 * Mémorise l'offre payante choisie sur la landing/page tarifs, le temps que
 * l'utilisateur passe par inscription/connexion/onboarding — jusqu'à ce que
 * ProtectedRoute le redirige vers /checkout. sessionStorage (pas
 * localStorage) : l'intention ne doit pas survivre au-delà de l'onglet/de la
 * session en cours. Ne contient jamais de prix, seulement le code du plan
 * (ex: "standard", "pro") — le backend reste la seule source de vérité pour
 * le montant réel (voir CheckoutDto).
 */
const STORAGE_KEY = 'uge:pendingPlanCode';

export function setPendingPlan(code: string): void {
  sessionStorage.setItem(STORAGE_KEY, code);
}

export function peekPendingPlan(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

/** Lit puis efface en une seule fois — la redirection ne doit se déclencher
 * qu'une fois, pas boucler indéfiniment tant que l'utilisateur navigue. */
export function consumePendingPlan(): string | null {
  const code = sessionStorage.getItem(STORAGE_KEY);
  if (code) {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return code;
}

export function clearPendingPlan(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
