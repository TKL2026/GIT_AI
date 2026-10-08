import { ApiProperty } from '@nestjs/swagger';

export class ImportRowErrorDto {
  @ApiProperty({ description: '0 si l’erreur ne concerne pas une ligne précise.' })
  line!: number;

  @ApiProperty()
  message!: string;
}

export class ImportProductsResultDto {
  @ApiProperty()
  importedCount!: number;

  @ApiProperty()
  rejectedCount!: number;

  @ApiProperty({ type: [ImportRowErrorDto] })
  errors!: ImportRowErrorDto[];
}
