import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CopilotQuotaService } from "../entitlements/copilot-quota.service";
import { CopilotUserQuotaService } from "../entitlements/copilot-user-quota.service";
import { AuthenticatedUser } from "../types/authenticated-user.interface";

/**
 * Garde dédié au Copilot, appliqué uniquement sur CopilotController::chat
 * (pas global comme SubscriptionGuard/FeatureGuard) : SubscriptionGuard
 * bloque déjà entièrement AWAITING_PAYMENT/TRIAL_EXPIRED/EXPIRED avant
 * d'arriver ici, ce garde n'a donc réellement à gérer que TRIAL, ACTIVE,
 * LAUNCH_PROGRAM et "pas d'abonnement" (accès illimité hérité, comme le
 * compte démo).
 *
 * Dispatch : LAUNCH_PROGRAM -> quota PAR UTILISATEUR (CopilotUserQuotaService,
 * 700/mois par défaut) ; tout le reste -> quota PAR ORGANISATION existant
 * (CopilotQuotaService, 500/1500 selon le plan), strictement inchangé.
 *
 * Ne bloque jamais le reste de l'ERP : seul /copilot/chat dépend de ce
 * garde (pas /copilot/quota, lecture seule, voir CopilotController).
 */
@Injectable()
export class CopilotQuotaGuard {
  constructor(
    private readonly prisma: PrismaService,
    private readonly copilotQuotaService: CopilotQuotaService,
    private readonly copilotUserQuotaService: CopilotUserQuotaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    // Pas d'utilisateur = route @Public(), un autre garde gère déjà l'accès.
    if (!user) return true;

    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId: user.organizationId },
      select: { status: true },
    });
    const usesPerUserQuota = subscription?.status === "LAUNCH_PROGRAM";
    // Posé sur l'utilisateur de la requête : CopilotController/CopilotService
    // s'en servent pour savoir quoi relâcher en cas d'échec technique, sans
    // refaire la même lecture de Subscription.
    user.copilotQuotaMechanism = usesPerUserQuota ? "per-user" : "org";

    const { allowed } = usesPerUserQuota
      ? await this.copilotUserQuotaService.consumeOne(user.userId)
      : await this.copilotQuotaService.consumeOne(user.organizationId);

    if (!allowed) {
      throw new ForbiddenException({
        message:
          "Vous avez atteint votre quota mensuel de requêtes Copilot. Votre espace UGE reste entièrement accessible. Passez à une offre supérieure pour bénéficier de davantage de requêtes Copilot.",
        code: "COPILOT_QUOTA_EXCEEDED",
      });
    }

    return true;
  }
}
