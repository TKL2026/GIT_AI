import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class StockAdjustmentDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: 45, description: 'Nouvelle quantité constatée en stock.' })
  @IsInt()
  @Min(0)
  newQuantity!: number;

  @ApiProperty({ example: 'Écart constaté lors de l\'inventaire du 10/07' })
  @IsString()
  @MinLength(3)
  reason!: string;
}
