import { applyDecorators, UseGuards } from "@nestjs/common";
import { Public } from "../../../common/decorators/public.decorator";
import { SkipSubscriptionCheck } from "../../../common/decorators/skip-subscription-check.decorator";
import { PlatformAdminAuthGuard } from "../guards/platform-admin-auth.guard";

/**
 * À poser sur chaque contrôleur /admin/* (hors login lui-même).
 * @Public() + @SkipSubscriptionCheck() neutralisent les guards globaux
 * pensés pour les utilisateurs d'organisation (JwtAuthGuard, SubscriptionGuard,
 * FeatureGuard — RolesGuard ne s'applique de toute façon que si @Roles() est
 * posé, jamais le cas ici), puis PlatformAdminAuthGuard applique la vraie
 * vérification d'authentification admin.
 */
export function AdminProtected() {
  return applyDecorators(
    Public(),
    SkipSubscriptionCheck(),
    UseGuards(PlatformAdminAuthGuard),
  );
}
