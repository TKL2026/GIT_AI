import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, Sale, SaleItem } from '@prisma/client';

export class SaleItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unitPrice!: number;

  @ApiProperty()
  lineTotal!: number;

  static fromEntity(item: SaleItem): SaleItemResponseDto {
    const dto = new SaleItemResponseDto();
    dto.id = item.id;
    dto.productId = item.productId;
    dto.productName = item.productName;
    dto.quantity = item.quantity;
    dto.unitPrice = Number(item.unitPrice);
    dto.lineTotal = Number(item.lineTotal);
    return dto;
  }
}

export class SaleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  performedByUserId!: string;

  @ApiPropertyOptional()
  customerName!: string | null;

  @ApiPropertyOptional()
  customerPhone!: string | null;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod!: PaymentMethod;

  @ApiProperty()
  totalAmount!: number;

  @ApiProperty({ type: [SaleItemResponseDto] })
  items!: SaleItemResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  static fromEntity(sale: Sale & { items: SaleItem[] }): SaleResponseDto {
    const dto = new SaleResponseDto();
    dto.id = sale.id;
    dto.organizationId = sale.organizationId;
    dto.performedByUserId = sale.performedByUserId;
    dto.customerName = sale.customerName;
    dto.customerPhone = sale.customerPhone;
    dto.paymentMethod = sale.paymentMethod;
    dto.totalAmount = Number(sale.totalAmount);
    dto.items = sale.items.map(SaleItemResponseDto.fromEntity);
    dto.createdAt = sale.createdAt;
    return dto;
  }
}
