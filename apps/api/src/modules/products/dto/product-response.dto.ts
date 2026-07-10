import { ApiProperty } from '@nestjs/swagger';
import { Product } from '@prisma/client';

export class ProductResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  purchasePrice!: number;

  @ApiProperty()
  salePrice!: number;

  @ApiProperty()
  createdAt!: Date;

  static fromEntity(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.organizationId = product.organizationId;
    dto.name = product.name;
    dto.sku = product.sku;
    dto.purchasePrice = Number(product.purchasePrice);
    dto.salePrice = Number(product.salePrice);
    dto.createdAt = product.createdAt;
    return dto;
  }
}
