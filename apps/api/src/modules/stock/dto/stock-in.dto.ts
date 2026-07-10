import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class StockInDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: 'Réception commande fournisseur #123' })
  @IsOptional()
  @IsString()
  reason?: string;
}
