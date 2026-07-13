import { ApiProperty } from '@nestjs/swagger';

export class CrossSellPairResponseDto {
  @ApiProperty()
  productAId!: string;

  @ApiProperty()
  productAName!: string;

  @ApiProperty()
  productBId!: string;

  @ApiProperty()
  productBName!: string;

  @ApiProperty()
  coOccurrenceCount!: number;
}
