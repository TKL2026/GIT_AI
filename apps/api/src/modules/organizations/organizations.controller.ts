import { Body, Controller, Get, NotFoundException, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  @ApiOkResponse({ type: OrganizationResponseDto })
  async me(@CurrentUser() currentUser: AuthenticatedUser): Promise<OrganizationResponseDto> {
    const organization = await this.organizationsService.findById(currentUser.organizationId);
    if (!organization) {
      throw new NotFoundException('Organisation introuvable.');
    }
    return OrganizationResponseDto.fromEntity(organization);
  }

  /**
   * Mise à jour incrémentale utilisée par l'assistant d'inscription
   * (chaque écran ne modifie que ses propres champs) — réservée au OWNER
   * puisqu'elle touche la configuration de l'organisation entière.
   */
  @Patch('me')
  @Roles(Role.OWNER)
  @ApiOkResponse({ type: OrganizationResponseDto })
  async updateMe(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.organizationsService.update(currentUser.organizationId, dto);
    return OrganizationResponseDto.fromEntity(organization);
  }

  @Post('me/complete-onboarding')
  @Roles(Role.OWNER)
  @ApiOkResponse({ type: OrganizationResponseDto })
  async completeOnboarding(@CurrentUser() currentUser: AuthenticatedUser): Promise<OrganizationResponseDto> {
    const organization = await this.organizationsService.completeOnboarding(currentUser.organizationId);
    return OrganizationResponseDto.fromEntity(organization);
  }
}
