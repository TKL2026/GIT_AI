import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { CommercialService } from './commercial.service';
import { CommercialLimitQueryDto } from './dto/commercial-limit-query.dto';
import { CrossSellPairResponseDto } from './dto/cross-sell-pair-response.dto';
import { CustomerInsightResponseDto } from './dto/customer-insight-response.dto';
import { ProductToPushResponseDto } from './dto/product-to-push-response.dto';

@ApiTags('commercial')
@ApiBearerAuth()
@Controller('commercial')
export class CommercialController {
  constructor(private readonly commercialService: CommercialService) {}

  @Get('products-to-push')
  @ApiOkResponse({ type: [ProductToPushResponseDto] })
  getProductsToPush(@CurrentUser() currentUser: AuthenticatedUser): Promise<ProductToPushResponseDto[]> {
    return this.commercialService.getProductsToPush(currentUser.organizationId);
  }

  @Get('customer-insights')
  @ApiOkResponse({ type: [CustomerInsightResponseDto] })
  getCustomerInsights(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: CommercialLimitQueryDto,
  ): Promise<CustomerInsightResponseDto[]> {
    return this.commercialService.getCustomerInsights(currentUser.organizationId, query.limit);
  }

  @Get('cross-sell')
  @ApiOkResponse({ type: [CrossSellPairResponseDto] })
  getCrossSellOpportunities(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: CommercialLimitQueryDto,
  ): Promise<CrossSellPairResponseDto[]> {
    return this.commercialService.getCrossSellOpportunities(currentUser.organizationId, query.limit);
  }
}
