import { ApiProperty } from '@nestjs/swagger';

export class CustomerInsightResponseDto {
  @ApiProperty()
  customerLabel!: string;

  @ApiProperty()
  totalSpent!: number;

  @ApiProperty()
  purchaseCount!: number;

  @ApiProperty()
  lastPurchaseAt!: string;

  @ApiProperty()
  daysSinceLastPurchase!: number;
}
