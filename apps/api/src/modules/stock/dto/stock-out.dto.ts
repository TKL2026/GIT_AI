import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class StockOutDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: 'Vente comptoir' })
  @IsOptional()
  @IsString()
  reason?: string;
}
