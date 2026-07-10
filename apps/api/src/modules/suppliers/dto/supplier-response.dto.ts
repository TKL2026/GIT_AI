import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Supplier } from '@prisma/client';

export class SupplierResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  contactName!: string | null;

  @ApiPropertyOptional()
  phone!: string | null;

  @ApiPropertyOptional()
  email!: string | null;

  @ApiPropertyOptional()
  address!: string | null;

  @ApiProperty()
  createdAt!: Date;

  static fromEntity(supplier: Supplier): SupplierResponseDto {
    const dto = new SupplierResponseDto();
    dto.id = supplier.id;
    dto.organizationId = supplier.organizationId;
    dto.name = supplier.name;
    dto.contactName = supplier.contactName;
    dto.phone = supplier.phone;
    dto.email = supplier.email;
    dto.address = supplier.address;
    dto.createdAt = supplier.createdAt;
    return dto;
  }
}
