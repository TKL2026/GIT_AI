import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { FinanceQueryDto } from './dto/finance-query.dto';
import { FinanceSummaryResponseDto } from './dto/finance-summary-response.dto';
import { MonthlyFinanceTrendResponseDto } from './dto/monthly-finance-trend-response.dto';
import { MonthlyTrendQueryDto } from './dto/monthly-trend-query.dto';
import { ProductProfitabilityResponseDto } from './dto/product-profitability-response.dto';
import { FinanceService } from './finance.service';

@ApiTags('finance')
@ApiBearerAuth()
@Roles(Role.OWNER, Role.ADMIN, Role.DIRECTOR)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  @ApiOkResponse({ type: FinanceSummaryResponseDto })
  getSummary(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: FinanceQueryDto,
  ): Promise<FinanceSummaryResponseDto> {
    return this.financeService.getSummary(currentUser.organizationId, query.from, query.to);
  }

  @Get('products-profitability')
  @ApiOkResponse({ type: [ProductProfitabilityResponseDto] })
  getProductsProfitability(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: FinanceQueryDto,
  ): Promise<ProductProfitabilityResponseDto[]> {
    return this.financeService.getProductsProfitability(
      currentUser.organizationId,
      query.from,
      query.to,
    );
  }

  @Get('monthly-trend')
  @ApiOkResponse({ type: [MonthlyFinanceTrendResponseDto] })
  getMonthlyTrend(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: MonthlyTrendQueryDto,
  ): Promise<MonthlyFinanceTrendResponseDto[]> {
    return this.financeService.getMonthlyTrend(currentUser.organizationId, query.months);
  }
}
