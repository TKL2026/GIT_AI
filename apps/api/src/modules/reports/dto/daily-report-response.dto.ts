import { ApiProperty } from "@nestjs/swagger";
import { ProductProfitabilityResponseDto } from "../../finance/dto/product-profitability-response.dto";
import { StockAlertItemDto } from "./stock-alert-item.dto";

export class DailyReportResponseDto {
  @ApiProperty({ example: "2026-10-27" })
  date!: string;

  @ApiProperty({ example: "27/10/2026" })
  dateLabel!: string;

  @ApiProperty()
  organizationName!: string;

  @ApiProperty({
    description: "Faux si aucune vente n'a été enregistrée ce jour-là.",
  })
  hasActivity!: boolean;

  @ApiProperty()
  totalRevenue!: number;

  @ApiProperty()
  totalExpenses!: number;

  @ApiProperty()
  totalCogs!: number;

  @ApiProperty()
  grossMargin!: number;

  @ApiProperty()
  netProfit!: number;

  @ApiProperty()
  salesCount!: number;

  @ApiProperty({ type: [ProductProfitabilityResponseDto] })
  topProducts!: ProductProfitabilityResponseDto[];

  @ApiProperty({ type: [StockAlertItemDto] })
  stockAlerts!: StockAlertItemDto[];
}
