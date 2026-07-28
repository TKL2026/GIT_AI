import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PurchaseRecommendationResponseDto {
  @ApiProperty()
  productId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  recommendedQuantity!: number;

  @ApiPropertyOptional()
  daysUntilStockout!: number | null;

  @ApiPropertyOptional()
  recommendedSupplierId!: string | null;

  @ApiPropertyOptional()
  recommendedSupplierName!: string | null;

  @ApiPropertyOptional()
  lastUnitCost!: number | null;

  @ApiProperty()
  alternativeSupplierCount!: number;

  @ApiProperty()
  hasSupplierHistory!: boolean;
}
