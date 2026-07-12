import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type FraudAnomalyType = 'unexplained_stock_adjustment' | 'below_catalog_price_sale';
export type FraudAnomalySeverity = 'medium' | 'high';

export class FraudAnomalyResponseDto {
  @ApiProperty({ enum: ['unexplained_stock_adjustment', 'below_catalog_price_sale'] })
  type!: FraudAnomalyType;

  @ApiProperty({ enum: ['medium', 'high'] })
  severity!: FraudAnomalySeverity;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  productName!: string;

  @ApiPropertyOptional()
  performedByUserId!: string | null;

  @ApiProperty()
  occurrencesCount!: number;

  @ApiProperty()
  totalImpact!: number;

  @ApiProperty()
  description!: string;
}
