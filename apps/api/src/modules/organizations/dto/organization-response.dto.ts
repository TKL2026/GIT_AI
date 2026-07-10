import { ApiProperty } from '@nestjs/swagger';
import { Organization } from '@prisma/client';

export class OrganizationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  createdAt!: Date;

  static fromEntity(organization: Organization): OrganizationResponseDto {
    const dto = new OrganizationResponseDto();
    dto.id = organization.id;
    dto.name = organization.name;
    dto.createdAt = organization.createdAt;
    return dto;
  }
}
