import { SubscriptionStatus } from '@prisma/client';

interface SubscriptionLike {
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
}

/**
 * Absence de ligne Subscription = organisation en accès libre (compte démo,
 * organisations créées avant l'introduction de l'essai) — voir schema.prisma.
 * PAST_DUE/CANCELLED ne sont volontairement pas traités ici : rien dans le
 * code ne produit ces statuts aujourd'hui.
 */
export function isSubscriptionLocked(subscription: SubscriptionLike | null): boolean {
  if (!subscription) return false;
  if (subscription.status === 'EXPIRED') return true;
  // Offre payante choisie à l'inscription, paiement jamais confirmé : aucun
  // accès n'a jamais été accordé, il n'y a donc rien à faire expirer ici —
  // verrouillé inconditionnellement tant que le webhook n'a pas activé
  // l'abonnement (voir BillingService#activateSubscription).
  if (subscription.status === 'AWAITING_PAYMENT') return true;
  if (
    subscription.status === 'TRIAL' &&
    subscription.currentPeriodEnd !== null &&
    subscription.currentPeriodEnd < new Date()
  ) {
    return true;
  }
  return false;
}
