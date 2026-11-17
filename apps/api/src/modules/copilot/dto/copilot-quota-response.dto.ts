import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CopilotQuotaResponseDto {
  @ApiProperty()
  used!: number;

  @ApiPropertyOptional({ nullable: true })
  limit!: number | null;

  @ApiPropertyOptional({ nullable: true })
  remaining!: number | null;

  /** true uniquement pour les organisations LAUNCH_PROGRAM — seul cas où
   * l'UI doit afficher la barre de progression (requirement métier). */
  @ApiProperty()
  isLaunchProgram!: boolean;
}
