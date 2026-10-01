import { Global, Module } from "@nestjs/common";
import { EntitlementsService } from "./entitlements.service";

/** Global comme PrismaModule : EntitlementsService est consulté depuis des
 * modules sans lien direct entre eux (FeatureGuard, InvitesService,
 * OrganizationsService) — éviter d'avoir à l'importer partout. */
@Global()
@Module({
  providers: [EntitlementsService],
  exports: [EntitlementsService],
})
export class EntitlementsModule {}
