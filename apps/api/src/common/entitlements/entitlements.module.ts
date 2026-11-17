import { Global, Module } from "@nestjs/common";
import { CopilotQuotaService } from "./copilot-quota.service";
import { CopilotUserQuotaService } from "./copilot-user-quota.service";
import { EntitlementsService } from "./entitlements.service";

/** Global comme PrismaModule : EntitlementsService/CopilotQuotaService sont
 * consultés depuis des modules sans lien direct entre eux (FeatureGuard,
 * InvitesService, OrganizationsService, CopilotQuotaGuard) — éviter d'avoir
 * à les importer partout. CopilotUserQuotaService suit le même besoin pour
 * le quota par utilisateur des organisations LAUNCH_PROGRAM. */
@Global()
@Module({
  providers: [EntitlementsService, CopilotQuotaService, CopilotUserQuotaService],
  exports: [EntitlementsService, CopilotQuotaService, CopilotUserQuotaService],
})
export class EntitlementsModule {}
