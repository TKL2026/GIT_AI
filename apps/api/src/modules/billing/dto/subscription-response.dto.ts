import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Plan, Subscription, SubscriptionStatus } from '@prisma/client';
import { PlanResponseDto } from './plan-response.dto';

export class SubscriptionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: SubscriptionStatus })
  status!: SubscriptionStatus;

  @ApiPropertyOptional({ type: PlanResponseDto, nullable: true })
  plan!: PlanResponseDto | null;

  @ApiPropertyOptional({ nullable: true })
  startedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  currentPeriodEnd!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  cancelledAt!: Date | null;

  static fromEntity(subscription: Subscription & { plan: Plan | null }): SubscriptionResponseDto {
    const dto = new SubscriptionResponseDto();
    dto.id = subscription.id;
    dto.status = subscription.status;
    dto.plan = subscription.plan ? PlanResponseDto.fromEntity(subscription.plan) : null;
    dto.startedAt = subscription.startedAt;
    dto.currentPeriodEnd = subscription.currentPeriodEnd;
    dto.cancelledAt = subscription.cancelledAt;
    return dto;
  }
}
