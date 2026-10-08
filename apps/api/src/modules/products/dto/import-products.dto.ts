import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

/**
 * Une ligne mappée côté frontend (fichier → champs UGE). Tous les champs
 * métier sont des chaînes optionnelles : la conversion/validation de type
 * (nombre, entier, positivité...) est une règle métier, pas une règle de
 * forme — elle est faite manuellement dans ProductsImportService pour
 * pouvoir rejeter une ligne précise sans faire échouer tout le lot (le
 * ValidationPipe global est strict : whitelist + forbidNonWhitelisted).
 */
export class ImportProductRowDto {
  @ApiProperty({ description: 'Numéro de ligne dans le fichier source (pour les messages d’erreur).' })
  @IsInt()
  @Min(1)
  line!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchasePrice?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salePrice?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  initialStock?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  minStock?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  maxStock?: string;
}

export class ImportProductsDto {
  @ApiProperty({ type: [ImportProductRowDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImportProductRowDto)
  rows!: ImportProductRowDto[];
}
