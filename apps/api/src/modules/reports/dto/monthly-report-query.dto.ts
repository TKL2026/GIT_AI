import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { IsCalendarMonthString } from "../../../common/validators/calendar-date.validator";

export class MonthlyReportQueryDto {
  @ApiPropertyOptional({
    example: "2026-10",
    description: "Défaut : mois en cours (Africa/Douala).",
  })
  @IsOptional()
  @IsCalendarMonthString()
  month?: string;
}
