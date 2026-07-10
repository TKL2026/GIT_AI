import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsPositive,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class PurchaseOrderItemInputDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 11000 })
  @IsPositive()
  unitCost!: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty()
  @IsUUID()
  supplierId!: string;

  @ApiProperty({ type: [PurchaseOrderItemInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemInputDto)
  items!: PurchaseOrderItemInputDto[];
}
