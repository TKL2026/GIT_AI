import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { FraudAnomalyResponseDto } from './dto/fraud-anomaly-response.dto';
import { FraudService } from './fraud.service';

@ApiTags('fraud')
@ApiBearerAuth()
@Roles(Role.OWNER, Role.ADMIN, Role.DIRECTOR)
@Controller('fraud')
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Get('anomalies')
  @ApiOkResponse({ type: [FraudAnomalyResponseDto] })
  getAnomalies(@CurrentUser() currentUser: AuthenticatedUser): Promise<FraudAnomalyResponseDto[]> {
    return this.fraudService.getAnomalies(currentUser.organizationId);
  }
}
