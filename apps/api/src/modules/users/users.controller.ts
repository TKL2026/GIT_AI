import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOkResponse({ type: UserResponseDto })
  async me(@CurrentUser() currentUser: AuthenticatedUser): Promise<UserResponseDto> {
    const user = await this.usersService.findById(currentUser.userId);
    return UserResponseDto.fromEntity(user!);
  }

  @Get()
  @ApiOkResponse({ type: [UserResponseDto] })
  async findAll(@CurrentUser() currentUser: AuthenticatedUser): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAllByOrganization(currentUser.organizationId);
    return users.map(UserResponseDto.fromEntity);
  }
}
