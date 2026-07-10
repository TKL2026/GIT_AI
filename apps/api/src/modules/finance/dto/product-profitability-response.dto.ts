import { ApiProperty } from '@nestjs/swagger';

export class ProductProfitabilityResponseDto {
  @ApiProperty()
  productId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  quantitySold!: number;

  @ApiProperty()
  totalRevenue!: number;

  @ApiProperty()
  estimatedCost!: number;

  @ApiProperty()
  estimatedMargin!: number;
}
