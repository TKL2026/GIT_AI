import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export const ONBOARDING_STEPS = ['company', 'activity', 'products', 'team', 'review', 'done'] as const;

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Boutique Awa' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'Cameroun' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'XAF' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'commerce' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: '2-5' })
  @IsOptional()
  @IsString()
  teamSize?: string;

  @ApiPropertyOptional({ type: [String], example: ['stock', 'sales'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modules?: string[];

  @ApiPropertyOptional({ enum: ONBOARDING_STEPS })
  @IsOptional()
  @IsIn(ONBOARDING_STEPS)
  onboardingStep?: (typeof ONBOARDING_STEPS)[number];
}
