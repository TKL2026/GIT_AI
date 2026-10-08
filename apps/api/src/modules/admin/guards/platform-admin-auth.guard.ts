import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthenticatedPlatformAdmin } from "../../../common/types/authenticated-platform-admin.interface";

/**
 * Garde explicite (appliquée via @UseGuards, jamais globale) posée sur
 * chaque contrôleur /admin/*. Peuple `request.platformAdmin` — jamais
 * `request.user` — pour qu'un éventuel code lisant `request.user` ne puisse
 * jamais confondre un admin plateforme avec un utilisateur d'organisation.
 */
@Injectable()
export class PlatformAdminAuthGuard extends AuthGuard("jwt-platform-admin") {
  handleRequest<TUser = AuthenticatedPlatformAdmin>(
    err: unknown,
    admin: AuthenticatedPlatformAdmin,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    const validated = super.handleRequest(
      err,
      admin,
      info,
      context,
    ) as AuthenticatedPlatformAdmin;
    context.switchToHttp().getRequest().platformAdmin = validated;
    return validated as TUser;
  }
}
