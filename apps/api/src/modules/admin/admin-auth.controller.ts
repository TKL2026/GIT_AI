import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CurrentPlatformAdmin } from "../../common/decorators/current-platform-admin.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { SkipSubscriptionCheck } from "../../common/decorators/skip-subscription-check.decorator";
import { AuthenticatedPlatformAdmin } from "../../common/types/authenticated-platform-admin.interface";
import { AdminAuthResponseDto } from "./dto/admin-auth-response.dto";
import { AdminLoginDto } from "./dto/admin-login.dto";
import { PlatformAdminResponseDto } from "./dto/platform-admin-response.dto";
import { PlatformAdminAuthGuard } from "./guards/platform-admin-auth.guard";
import { PlatformAdminAuthService } from "./platform-admin-auth.service";

/**
 * Hors AdminProtected() volontairement : /login doit rester accessible sans
 * token (c'est lui qui en délivre un), /me a besoin d'un garde explicite
 * (PlatformAdminAuthGuard) mais pas des deux autres (il n'y a pas de guards
 * globaux tenant à neutraliser une fois qu'on sait déjà que la requête vient
 * d'un contexte /admin/auth).
 */
@ApiTags("admin-auth")
@Controller("admin/auth")
@Public()
@SkipSubscriptionCheck()
export class AdminAuthController {
  constructor(
    private readonly platformAdminAuthService: PlatformAdminAuthService,
  ) {}

  @Post("login")
  @ApiOkResponse({ type: AdminAuthResponseDto })
  async login(@Body() dto: AdminLoginDto): Promise<AdminAuthResponseDto> {
    const { admin, accessToken } =
      await this.platformAdminAuthService.login(dto);
    const response = new AdminAuthResponseDto();
    response.accessToken = accessToken;
    response.admin = PlatformAdminResponseDto.fromEntity(admin);
    return response;
  }

  @Get("me")
  @UseGuards(PlatformAdminAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: PlatformAdminResponseDto })
  async me(
    @CurrentPlatformAdmin() currentAdmin: AuthenticatedPlatformAdmin,
  ): Promise<PlatformAdminResponseDto> {
    const admin = await this.platformAdminAuthService.findById(
      currentAdmin.platformAdminId,
    );
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException();
    }
    return PlatformAdminResponseDto.fromEntity(admin);
  }
}
