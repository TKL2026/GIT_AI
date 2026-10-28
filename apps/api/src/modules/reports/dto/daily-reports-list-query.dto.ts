import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { IsCalendarDateString } from "../../../common/validators/calendar-date.validator";

/**
 * Même validateur calendaire que DailyReportQueryDto/MonthlyReportQueryDto
 * (voir calendar-date.validator.ts) : non explicitement signalé par le QA
 * sur ce DTO précis, mais c'est exactement la même classe de bug (une
 * simple vérification de forme laisse passer "2026-13-45") sur le même
 * champ de saisie libre — corrigé ici par cohérence plutôt que de laisser
 * un trou identique non corrigé sur l'endpoint liste.
 */
export class DailyReportsListQueryDto {
  @ApiProperty({ example: "2026-10-01" })
  @IsNotEmpty()
  @IsCalendarDateString()
  from!: string;

  @ApiProperty({ example: "2026-10-27" })
  @IsNotEmpty()
  @IsCalendarDateString()
  to!: string;
}
