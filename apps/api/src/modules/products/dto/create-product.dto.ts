import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Riz 25kg' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'RIZ-25KG' })
  @IsString()
  @MinLength(1)
  sku!: string;

  @ApiProperty({ example: 12000 })
  @IsNumber()
  @IsPositive()
  purchasePrice!: number;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @IsPositive()
  salePrice!: number;
}
