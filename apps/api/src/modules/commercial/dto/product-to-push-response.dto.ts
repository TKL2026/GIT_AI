import { ApiProperty } from '@nestjs/swagger';

export class ProductToPushResponseDto {
  @ApiProperty()
  productId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  marginPerUnit!: number;

  @ApiProperty()
  stockQuantity!: number;

  @ApiProperty()
  description!: string;
}
