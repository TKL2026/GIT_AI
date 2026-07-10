import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockMovement, StockMovementType } from '@prisma/client';

export class StockMovementResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  performedByUserId!: string;

  @ApiProperty({ enum: StockMovementType })
  type!: StockMovementType;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  previousQuantity!: number;

  @ApiProperty()
  newQuantity!: number;

  @ApiPropertyOptional()
  reason!: string | null;

  @ApiProperty()
  createdAt!: Date;

  static fromEntity(movement: StockMovement): StockMovementResponseDto {
    const dto = new StockMovementResponseDto();
    dto.id = movement.id;
    dto.organizationId = movement.organizationId;
    dto.productId = movement.productId;
    dto.performedByUserId = movement.performedByUserId;
    dto.type = movement.type;
    dto.quantity = movement.quantity;
    dto.previousQuantity = movement.previousQuantity;
    dto.newQuantity = movement.newQuantity;
    dto.reason = movement.reason;
    dto.createdAt = movement.createdAt;
    return dto;
  }
}
