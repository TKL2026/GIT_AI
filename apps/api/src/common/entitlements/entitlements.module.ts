import { Global, Module } from "@nestjs/common";
import { CopilotQuotaService } from "./copilot-quota.service";
import { EntitlementsService } from "./entitlements.service";

/** Global comme PrismaModule : EntitlementsService/CopilotQuotaService sont
 * consultés depuis des modules sans lien direct entre eux (FeatureGuard,
 * InvitesService, OrganizationsService, CopilotQuotaGuard) — éviter d'avoir
 * à les importer partout. */
@Global()
@Module({
  providers: [EntitlementsService, CopilotQuotaService],
  exports: [EntitlementsService, CopilotQuotaService],
})
export class EntitlementsModule {}
