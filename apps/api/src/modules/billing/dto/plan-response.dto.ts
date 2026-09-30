import { ApiProperty } from '@nestjs/swagger';
import { Plan, SubscriptionPeriod } from '@prisma/client';

export class PlanResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  price!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ enum: SubscriptionPeriod })
  period!: SubscriptionPeriod;

  @ApiProperty({ nullable: true })
  features!: unknown;

  @ApiProperty()
  isActive!: boolean;

  static fromEntity(plan: Plan): PlanResponseDto {
    const dto = new PlanResponseDto();
    dto.id = plan.id;
    dto.code = plan.code;
    dto.name = plan.name;
    dto.price = plan.price;
    dto.currency = plan.currency;
    dto.period = plan.period;
    dto.features = plan.features;
    dto.isActive = plan.isActive;
    return dto;
  }
}
