import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { ForecastResponseDto } from './dto/forecast-response.dto';
import { ForecastService } from './forecast.service';

@ApiTags('forecast')
@ApiBearerAuth()
@Controller('forecast')
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  @Get('replenishment')
  @ApiOkResponse({ type: [ForecastResponseDto] })
  getReplenishmentForecast(@CurrentUser() currentUser: AuthenticatedUser): Promise<ForecastResponseDto[]> {
    return this.forecastService.getReplenishmentForecast(currentUser.organizationId);
  }
}
