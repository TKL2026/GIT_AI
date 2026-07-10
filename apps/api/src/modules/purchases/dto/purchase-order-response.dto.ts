import { ApiProperty } from '@nestjs/swagger';
import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus, Supplier } from '@prisma/client';

export class PurchaseOrderItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unitCost!: number;

  @ApiProperty()
  lineTotal!: number;

  static fromEntity(item: PurchaseOrderItem): PurchaseOrderItemResponseDto {
    const dto = new PurchaseOrderItemResponseDto();
    dto.id = item.id;
    dto.productId = item.productId;
    dto.productName = item.productName;
    dto.quantity = item.quantity;
    dto.unitCost = Number(item.unitCost);
    dto.lineTotal = Number(item.lineTotal);
    return dto;
  }
}

export class PurchaseOrderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  supplierId!: string;

  @ApiProperty()
  supplierName!: string;

  @ApiProperty()
  performedByUserId!: string;

  @ApiProperty({ enum: PurchaseOrderStatus })
  status!: PurchaseOrderStatus;

  @ApiProperty()
  totalAmount!: number;

  @ApiProperty({ type: [PurchaseOrderItemResponseDto] })
  items!: PurchaseOrderItemResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ required: false, nullable: true })
  receivedAt!: Date | null;

  static fromEntity(
    order: PurchaseOrder & { items: PurchaseOrderItem[]; supplier: Supplier },
  ): PurchaseOrderResponseDto {
    const dto = new PurchaseOrderResponseDto();
    dto.id = order.id;
    dto.organizationId = order.organizationId;
    dto.supplierId = order.supplierId;
    dto.supplierName = order.supplier.name;
    dto.performedByUserId = order.performedByUserId;
    dto.status = order.status;
    dto.totalAmount = Number(order.totalAmount);
    dto.items = order.items.map(PurchaseOrderItemResponseDto.fromEntity);
    dto.createdAt = order.createdAt;
    dto.receivedAt = order.receivedAt;
    return dto;
  }
}
