import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { AuthResponseDto } from '../auth/dto/auth-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { InvitePreviewDto } from './dto/invite-preview.dto';
import { InvitesService } from './invites.service';

/** Routes publiques (pas de compte requis) consultées depuis le lien
 * d'invitation partagé manuellement par le propriétaire. */
@ApiTags('invites')
@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Public()
  @Get(':token')
  @ApiOkResponse({ type: InvitePreviewDto })
  async preview(@Param('token') token: string): Promise<InvitePreviewDto> {
    const invite = await this.invitesService.findValidByToken(token);
    return { organizationName: invite.organization.name, email: invite.email, role: invite.role };
  }

  @Public()
  @Post(':token/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthResponseDto })
  async accept(@Param('token') token: string, @Body() dto: AcceptInviteDto): Promise<AuthResponseDto> {
    const { user, tokens } = await this.invitesService.accept(token, dto);
    return { ...tokens, user: UserResponseDto.fromEntity(user) };
  }
}
