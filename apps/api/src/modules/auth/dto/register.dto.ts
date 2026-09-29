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
}
