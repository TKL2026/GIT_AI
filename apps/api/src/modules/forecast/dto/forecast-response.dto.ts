import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ForecastResponseDto {
  @ApiProperty()
  productId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  currentStock!: number;

  @ApiProperty()
  averageDailySales!: number;

  @ApiPropertyOptional()
  daysUntilStockout!: number | null;

  @ApiPropertyOptional()
  recommendedReorderQuantity!: number | null;
}
