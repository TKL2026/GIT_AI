import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Feature } from "@copilote/shared";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { REQUIRE_FEATURE_KEY } from "../decorators/require-feature.decorator";
import { AuthenticatedUser } from "../types/authenticated-user.interface";

/**
 * Deuxième palier d'autorisation, après SubscriptionGuard (verrou global) et
 * avant RolesGuard (rôle métier) — voir app.module.ts pour l'ordre exact.
 * Ne fait rien si l'endpoint n'a pas de @RequireFeature(...) : la grande
 * majorité des routes (cœur ERP) ne sont pas concernées, seules les
 * fonctionnalités réellement Pro-exclusives le sont.
 */
@Injectable()
export class FeatureGuard {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<
      Feature | undefined
    >(REQUIRE_FEATURE_KEY, [context.getHandler(), context.getClass()]);
    if (!requiredFeature) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    // Pas d'utilisateur = route @Public(), un autre garde gère déjà l'accès.
    if (!user) return true;

    const allowed = await this.entitlementsService.hasFeature(
      user.organizationId,
      requiredFeature,
    );
    if (!allowed) {
      throw new ForbiddenException({
        message: `Cette fonctionnalité (${requiredFeature}) n'est pas incluse dans votre offre actuelle. Passez à une offre supérieure pour y accéder.`,
        code: "FEATURE_NOT_INCLUDED",
        feature: requiredFeature,
      });
    }

    return true;
  }
}
