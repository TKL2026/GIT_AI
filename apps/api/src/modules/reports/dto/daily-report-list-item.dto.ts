import { ApiProperty } from "@nestjs/swagger";

export class DailyReportListItemDto {
  @ApiProperty({ example: "2026-10-27" })
  date!: string;

  @ApiProperty({ example: "27/10/2026" })
  dateLabel!: string;

  @ApiProperty()
  totalRevenue!: number;

  @ApiProperty()
  salesCount!: number;

  @ApiProperty({
    description: "Faux si aucune vente n'a été enregistrée ce jour-là.",
  })
  hasActivity!: boolean;
}
