import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  /**
   * Optionnel : l'onboarding ne demande le nom de l'entreprise qu'à
   * l'écran suivant (PATCH /organizations/me) — un nom générique est
   * utilisé ici si omis.
   */
  @ApiPropertyOptional({ example: 'Boutique Demo' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  organizationName?: string;

  @ApiProperty({ example: 'owner@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Awa' })
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty({ example: 'Diallo' })
  @IsString()
  @MinLength(1)
  lastName!: string;

  /**
   * Optionnel : code de l'offre payante choisie avant l'inscription (voir
   * pendingPlan.ts côté frontend). Jamais un prix — le backend revérifie
   * toujours que ce code correspond à un Plan actif réel avant de l'utiliser
   * (voir AuthService#register). Absent = essai gratuit de 48h (comportement
   * par défaut, inchangé).
   */
  @ApiPropertyOptional({ example: 'pro' })
  @IsOptional()
  @IsString()
  planCode?: string;
}
