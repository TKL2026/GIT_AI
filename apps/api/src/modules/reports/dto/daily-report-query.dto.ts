import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { IsCalendarDateString } from "../../../common/validators/calendar-date.validator";

export class DailyReportQueryDto {
  @ApiPropertyOptional({
    example: "2026-10-27",
    description: "Défaut : aujourd'hui (Africa/Douala).",
  })
  @IsOptional()
  @IsCalendarDateString()
  date?: string;
}
