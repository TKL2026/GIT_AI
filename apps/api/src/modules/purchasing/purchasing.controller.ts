import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FEATURES } from '@copilote/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { PurchaseRecommendationResponseDto } from './dto/purchase-recommendation-response.dto';
import { PurchasingService } from './purchasing.service';

@ApiTags('purchasing')
@ApiBearerAuth()
@RequireFeature(FEATURES.PURCHASING_AI)
@Controller('purchasing')
export class PurchasingController {
  constructor(private readonly purchasingService: PurchasingService) {}

  @Get('recommendations')
  @ApiOkResponse({ type: [PurchaseRecommendationResponseDto] })
  getRecommendations(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<PurchaseRecommendationResponseDto[]> {
    return this.purchasingService.getPurchaseRecommendations(currentUser.organizationId);
  }
}
