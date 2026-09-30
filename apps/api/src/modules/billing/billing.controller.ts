import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipSubscriptionCheck } from '../../common/decorators/skip-subscription-check.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { BillingService, CheckoutResult } from './billing.service';
import { CheckoutDto } from './dto/checkout.dto';
import { PlanResponseDto } from './dto/plan-response.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';

@ApiTags('billing')
@Controller()
@SkipSubscriptionCheck()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Public()
  @Get('billing/plans')
  @ApiOkResponse({ type: [PlanResponseDto] })
  async listPlans(): Promise<PlanResponseDto[]> {
    const plans = await this.billingService.listPlans();
    return plans.map(PlanResponseDto.fromEntity);
  }

  @Get('billing/subscription')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOkResponse({ type: SubscriptionResponseDto, description: 'null si aucun abonnement (accès libre pour le moment).' })
  async getSubscription(@CurrentUser() currentUser: AuthenticatedUser): Promise<SubscriptionResponseDto | null> {
    const subscription = await this.billingService.getSubscription(currentUser.organizationId);
    return subscription ? SubscriptionResponseDto.fromEntity(subscription) : null;
  }

  @Get('billing/transactions')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOkResponse({ type: [TransactionResponseDto] })
  async listTransactions(@CurrentUser() currentUser: AuthenticatedUser): Promise<TransactionResponseDto[]> {
    const transactions = await this.billingService.listTransactions(currentUser.organizationId);
    return transactions.map(TransactionResponseDto.fromEntity);
  }

  @Get('billing/transactions/:externalReference')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOkResponse({ type: TransactionResponseDto })
  async getTransaction(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('externalReference') externalReference: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.billingService.getTransactionForOrganization(
      currentUser.organizationId,
      externalReference,
    );
    return TransactionResponseDto.fromEntity(transaction);
  }

  @Post('billing/checkout')
  @Roles(Role.OWNER, Role.ADMIN)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOkResponse()
  async checkout(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CheckoutDto,
  ): Promise<CheckoutResult> {
    return this.billingService.checkout(currentUser.organizationId, dto);
  }
}
