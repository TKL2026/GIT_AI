import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CurrentPlatformAdmin } from "../../common/decorators/current-platform-admin.decorator";
import { AuthenticatedPlatformAdmin } from "../../common/types/authenticated-platform-admin.interface";
import { AdminProtected } from "./decorators/admin-protected.decorator";
import { AdminOrganizationsQueryDto } from "./dto/admin-organizations-query.dto";
import { ExtendTrialDto } from "./dto/extend-trial.dto";
import { AdminOrganizationsService } from "./admin-organizations.service";

@ApiTags("admin-organizations")
@ApiBearerAuth()
@Controller("admin/organizations")
@AdminProtected()
export class AdminOrganizationsController {
  constructor(
    private readonly adminOrganizationsService: AdminOrganizationsService,
  ) {}

  @Get()
  @ApiOkResponse({ description: "Liste paginée des organisations." })
  list(@Query() query: AdminOrganizationsQueryDto) {
    return this.adminOrganizationsService.list(query);
  }

  @Get(":id")
  @ApiOkResponse({ description: "Détail d'une organisation." })
  async getDetail(
    @Param("id") id: string,
    @CurrentPlatformAdmin() currentAdmin: AuthenticatedPlatformAdmin,
  ) {
    const detail = await this.adminOrganizationsService.getDetail(id);
    await this.adminOrganizationsService.recordView(id, currentAdmin);
    return detail;
  }

  @Post(":id/suspend")
  @HttpCode(200)
  @ApiOkResponse({ description: "Suspend une organisation." })
  async suspend(
    @Param("id") id: string,
    @CurrentPlatformAdmin() currentAdmin: AuthenticatedPlatformAdmin,
  ) {
    await this.adminOrganizationsService.suspend(id, currentAdmin);
    return { success: true };
  }

  @Post(":id/reactivate")
  @HttpCode(200)
  @ApiOkResponse({ description: "Réactive une organisation suspendue." })
  async reactivate(
    @Param("id") id: string,
    @CurrentPlatformAdmin() currentAdmin: AuthenticatedPlatformAdmin,
  ) {
    await this.adminOrganizationsService.reactivate(id, currentAdmin);
    return { success: true };
  }

  @Post(":id/extend-trial")
  @HttpCode(200)
  @ApiOkResponse({
    description: "Prolonge l'essai gratuit d'une organisation.",
  })
  async extendTrial(
    @Param("id") id: string,
    @Body() dto: ExtendTrialDto,
    @CurrentPlatformAdmin() currentAdmin: AuthenticatedPlatformAdmin,
  ) {
    await this.adminOrganizationsService.extendTrial(
      id,
      dto.days,
      currentAdmin,
    );
    return { success: true };
  }
}
