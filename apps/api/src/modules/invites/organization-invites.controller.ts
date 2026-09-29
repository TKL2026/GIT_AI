import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { CreateInviteDto } from './dto/create-invite.dto';
import { InviteResponseDto } from './dto/invite-response.dto';
import { InvitesService } from './invites.service';

/** Gestion des invitations depuis l'organisation de l'appelant — réservée
 * au OWNER (inviter des collaborateurs est une action de gestion d'équipe
 * sensible), distincte du contrôleur public d'acceptation. */
@ApiTags('invites')
@ApiBearerAuth()
@Controller('organizations/me/invites')
export class OrganizationInvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  @Roles(Role.OWNER)
  @ApiCreatedResponse({ type: InviteResponseDto })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateInviteDto,
  ): Promise<InviteResponseDto> {
    const invite = await this.invitesService.create(currentUser.organizationId, currentUser.userId, dto);
    return InviteResponseDto.fromEntity(invite);
  }

  @Get()
  @Roles(Role.OWNER)
  @ApiOkResponse({ type: [InviteResponseDto] })
  async findAll(@CurrentUser() currentUser: AuthenticatedUser): Promise<InviteResponseDto[]> {
    const invites = await this.invitesService.findAllByOrganization(currentUser.organizationId);
    return invites.map(InviteResponseDto.fromEntity);
  }
}
