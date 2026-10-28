import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { StockStatus } from "../../../common/stock/stock-status.util";

export class StockAlertItemDto {
  @ApiProperty()
  productId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  stockQuantity!: number;

  @ApiPropertyOptional()
  minStock!: number | null;

  @ApiProperty({ enum: ["out", "low"] })
  status!: Exclude<StockStatus, "ok">;
}
