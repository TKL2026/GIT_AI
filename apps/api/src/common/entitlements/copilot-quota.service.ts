import { Injectable } from "@nestjs/common";
import { PlanFeaturesJson } from "@copilote/shared";
import { PrismaService } from "../../prisma/prisma.service";

/** Quota de requêtes Copilot pendant l'essai gratuit de 7 jours — pas lié à
 * un Plan (aucun planId sur une Subscription TRIAL), donc non lisible depuis
 * PlanFeaturesJson comme pour Standard/Pro. */
export const TRIAL_COPILOT_QUOTA = 1500;

export interface CopilotQuotaConsumption {
  allowed: boolean;
  /** Quota résolu au moment de la vérification, `null` si illimité. */
  limit: number | null;
}

/**
 * Résout et consomme le quota de requêtes Copilot d'une organisation.
 * Suit exactement le même raisonnement par statut que
 * EntitlementsService#getFeatures (seule source de vérité pour "quel niveau
 * d'accès cette organisation a-t-elle en ce moment") :
 * - Pas de ligne Subscription -> accès libre historique -> quota illimité.
 * - TRIAL -> quota fixe (TRIAL_COPILOT_QUOTA), jamais remis à zéro (un seul
 *   essai de 7 jours, pas de renouvellement).
 * - ACTIVE + Plan -> copilotQuota défini sur ce Plan.
 * - Tout le reste (AWAITING_PAYMENT, TRIAL_EXPIRED, EXPIRED, PAST_DUE,
 *   CANCELLED) -> ne devrait jamais être atteint (SubscriptionGuard bloque
 *   déjà ces statuts avant que le Copilot ne soit appelé), quota 0 par
 *   défaut sûr si jamais invoqué directement.
 */
@Injectable()
export class CopilotQuotaService {
  constructor(private readonly prisma: PrismaService) {}

  async getQuota(organizationId: string): Promise<number | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
      include: { plan: true },
    });

    if (!subscription) {
      return null;
    }

    if (subscription.status === "TRIAL") {
      return TRIAL_COPILOT_QUOTA;
    }

    if (subscription.status === "ACTIVE" && subscription.plan) {
      const features = subscription.plan
        .features as unknown as PlanFeaturesJson | null;
      return features?.copilotQuota ?? null;
    }

    return 0;
  }

  /**
   * Incrémente le compteur de façon atomique, uniquement s'il reste du
   * quota disponible — même idiome compare-and-swap que
   * BillingService#applyPaymentResult et SubscriptionGuard (updateMany
   * conditionné, jamais de lecture-puis-écriture séparées) : deux requêtes
   * simultanées ne peuvent jamais faire dépasser le quota de plus d'une
   * unité, sans transaction `SERIALIZABLE`.
   */
  async consumeOne(organizationId: string): Promise<CopilotQuotaConsumption> {
    const limit = await this.getQuota(organizationId);

    if (limit === null) {
      return { allowed: true, limit: null };
    }

    const result = await this.prisma.subscription.updateMany({
      where: { organizationId, copilotRequestsUsed: { lt: limit } },
      data: { copilotRequestsUsed: { increment: 1 } },
    });

    return { allowed: result.count === 1, limit };
  }
}
