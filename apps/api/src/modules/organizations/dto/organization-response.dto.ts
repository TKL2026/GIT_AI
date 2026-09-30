import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { isSubscriptionLocked } from '../../../common/subscription/subscription-status.util';
import { OrganizationWithSubscription } from '../organizations.service';

export class OrganizationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional()
  country!: string | null;

  @ApiPropertyOptional()
  currency!: string | null;

  @ApiPropertyOptional()
  industry!: string | null;

  @ApiPropertyOptional()
  teamSize!: string | null;

  @ApiProperty({ type: [String] })
  modules!: string[];

  @ApiPropertyOptional()
  onboardingStep!: string | null;

  @ApiPropertyOptional()
  onboardingCompletedAt!: Date | null;

  // Calculé côté serveur — ne jamais exposer le statut/les dates brutes de
  // l'abonnement, juste ce booléen dont le frontend a besoin pour rediriger.
  @ApiProperty()
  accessLocked!: boolean;

  static fromEntity(organization: OrganizationWithSubscription): OrganizationResponseDto {
    const dto = new OrganizationResponseDto();
    dto.id = organization.id;
    dto.name = organization.name;
    dto.createdAt = organization.createdAt;
    dto.country = organization.country;
    dto.currency = organization.currency;
    dto.industry = organization.industry;
    dto.teamSize = organization.teamSize;
    dto.modules = organization.modules;
    dto.onboardingStep = organization.onboardingStep;
    dto.onboardingCompletedAt = organization.onboardingCompletedAt;
    dto.accessLocked = isSubscriptionLocked(organization.subscription);
    return dto;
  }
}
