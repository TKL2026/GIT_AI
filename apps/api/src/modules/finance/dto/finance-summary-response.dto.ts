import { ApiProperty } from '@nestjs/swagger';

export class FinanceSummaryResponseDto {
  @ApiProperty()
  totalRevenue!: number;

  @ApiProperty()
  totalExpenses!: number;

  @ApiProperty()
  totalCogs!: number;

  @ApiProperty()
  grossMargin!: number;

  @ApiProperty()
  netProfit!: number;

  @ApiProperty()
  salesCount!: number;
}
