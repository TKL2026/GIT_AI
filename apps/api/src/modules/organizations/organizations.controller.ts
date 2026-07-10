import { Controller, Get, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { OrganizationResponseDto } from './dto/organization-response.dto';
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
}
