import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { CopilotQuotaService } from "../entitlements/copilot-quota.service";
import { AuthenticatedUser } from "../types/authenticated-user.interface";

/**
 * Garde dédié au Copilot, appliqué uniquement sur CopilotController (pas
 * global comme SubscriptionGuard/FeatureGuard) : SubscriptionGuard bloque
 * déjà entièrement AWAITING_PAYMENT/TRIAL_EXPIRED/EXPIRED avant d'arriver
 * ici, ce garde n'a donc réellement à gérer que TRIAL, ACTIVE et "pas
 * d'abonnement" (accès illimité hérité, comme le compte démo).
 *
 * Ne bloque jamais le reste de l'ERP : seul /copilot/* dépend de ce garde.
 */
@Injectable()
export class CopilotQuotaGuard {
  constructor(private readonly copilotQuotaService: CopilotQuotaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    // Pas d'utilisateur = route @Public(), un autre garde gère déjà l'accès.
    if (!user) return true;

    const { allowed } = await this.copilotQuotaService.consumeOne(
      user.organizationId,
    );
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
