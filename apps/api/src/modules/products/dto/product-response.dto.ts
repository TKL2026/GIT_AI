import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '@prisma/client';
import { computeStockStatus, StockStatus } from '../../../common/stock/stock-status.util';

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
  stockQuantity!: number;

  @ApiPropertyOptional()
  minStock!: number | null;

  @ApiPropertyOptional()
  maxStock!: number | null;

  @ApiProperty({ enum: ['out', 'low', 'ok'] })
  stockStatus!: StockStatus;

  @ApiProperty()
  isActive!: boolean;

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
    dto.stockQuantity = product.stockQuantity;
    dto.minStock = product.minStock;
    dto.maxStock = product.maxStock;
    dto.stockStatus = computeStockStatus(product.stockQuantity, product.minStock);
    dto.isActive = product.isActive;
    dto.createdAt = product.createdAt;
    return dto;
  }
}
