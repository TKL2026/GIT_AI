import {
  PRO_FEATURES,
  type Feature,
  type PlanFeaturesJson,
} from "@copilote/shared";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Résout les fonctionnalités réellement accordées à une organisation.
 * Appelé uniquement après SubscriptionGuard (donc si une Subscription
 * existe et est verrouillée, on ne devrait jamais arriver ici — le cas
 * verrouillé est traité en filet de sécurité, sans y faire confiance comme
 * chemin normal).
 *
 * Règles (alignées sur isSubscriptionLocked / le comportement existant) :
 * - Pas de ligne Subscription (compte démo, organisations pré-abonnement)
 *   -> accès libre historique, donc niveau Pro complet.
 * - TRIAL (jamais verrouillé à ce stade puisque SubscriptionGuard a laissé
 *   passer) -> niveau Pro complet pendant les 48h, comme demandé.
 * - ACTIVE -> exactement les features du Plan payé, ni plus ni moins.
 * - Tout le reste (AWAITING_PAYMENT, EXPIRED, PAST_DUE, CANCELLED) -> aucune
 *   fonctionnalité. Ne devrait jamais être atteint en pratique (déjà
 *   bloqué plus tôt), mais reste sûr par défaut si jamais appelé ailleurs.
 */
@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeatures(organizationId: string): Promise<Set<Feature>> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
      include: { plan: true },
    });

    if (!subscription) {
      return new Set(PRO_FEATURES);
    }

    if (subscription.status === "TRIAL") {
      return new Set(PRO_FEATURES);
    }

    if (subscription.status === "ACTIVE" && subscription.plan) {
      const planFeatures = subscription.plan
        .features as unknown as PlanFeaturesJson | null;
      return new Set(planFeatures?.features ?? []);
    }

    return new Set();
  }

  async hasFeature(organizationId: string, feature: Feature): Promise<boolean> {
    const features = await this.getFeatures(organizationId);
    return features.has(feature);
  }
}
