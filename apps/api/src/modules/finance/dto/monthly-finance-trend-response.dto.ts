import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MonthlyFinanceTrendResponseDto {
  @ApiProperty({ example: '2026-07', description: 'Mois au format YYYY-MM.' })
  month!: string;

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

  @ApiPropertyOptional({ description: 'grossMargin / totalRevenue, null si aucun chiffre d’affaires.' })
  grossMarginRatio!: number | null;

  @ApiPropertyOptional({ description: 'netProfit / totalRevenue, null si aucun chiffre d’affaires.' })
  netMarginRatio!: number | null;

  @ApiPropertyOptional({
    description: 'Variation du chiffre d’affaires vs le mois précédent, null pour le premier mois de la série.',
  })
  revenueGrowthRatio!: number | null;
}
