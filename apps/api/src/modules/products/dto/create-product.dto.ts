import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsPositive, IsString, Min, MinLength } from 'class-validator';

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

  @ApiPropertyOptional({ example: 50, description: 'Quantité en stock au moment de la création.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  initialStock?: number;

  @ApiPropertyOptional({ example: 10, description: "Seuil minimum déclenchant une alerte de rupture." })
  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ example: 200, description: 'Seuil maximum recommandé.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxStock?: number;
}
