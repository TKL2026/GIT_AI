import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AdminAuditLogService } from "./admin-audit-log.service";
import { AdminAuditLogsController } from "./admin-audit-logs.controller";
import { AdminAuthController } from "./admin-auth.controller";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminDashboardService } from "./admin-dashboard.service";
import { AdminOrganizationsController } from "./admin-organizations.controller";
import { AdminOrganizationsService } from "./admin-organizations.service";
import { AdminPaymentsController } from "./admin-payments.controller";
import { AdminPaymentsService } from "./admin-payments.service";
import { AdminSubscriptionsController } from "./admin-subscriptions.controller";
import { AdminSubscriptionsService } from "./admin-subscriptions.service";
import { AdminSystemController } from "./admin-system.controller";
import { AdminSystemService } from "./admin-system.service";
import { AdminUsersController } from "./admin-users.controller";
import { AdminUsersService } from "./admin-users.service";
import { PlatformAdminAuthService } from "./platform-admin-auth.service";
import { PlatformAdminJwtStrategy } from "./strategies/platform-admin-jwt.strategy";

/**
 * Back-office plateforme (/admin/*). Volontairement un module séparé et
 * autosuffisant (sa propre stratégie Passport, son propre JwtModule) plutôt
 * que branché sur AuthModule : aucune dépendance croisée avec
 * l'authentification des organisations clientes.
 */
@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [
    AdminAuthController,
    AdminDashboardController,
    AdminOrganizationsController,
    AdminUsersController,
    AdminSubscriptionsController,
    AdminPaymentsController,
    AdminSystemController,
    AdminAuditLogsController,
  ],
  providers: [
    PlatformAdminJwtStrategy,
    PlatformAdminAuthService,
    AdminAuditLogService,
    AdminDashboardService,
    AdminOrganizationsService,
    AdminUsersService,
    AdminSubscriptionsService,
    AdminPaymentsService,
    AdminSystemService,
  ],
})
export class AdminModule {}
