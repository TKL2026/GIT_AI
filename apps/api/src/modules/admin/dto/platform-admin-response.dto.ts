import { ApiProperty } from "@nestjs/swagger";
import { PlatformAdmin } from "@prisma/client";

/** Expose volontairement le minimum (jamais passwordHash/isActive/lastLoginAt). */
export class PlatformAdminResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  static fromEntity(admin: PlatformAdmin): PlatformAdminResponseDto {
    const dto = new PlatformAdminResponseDto();
    dto.id = admin.id;
    dto.email = admin.email;
    dto.firstName = admin.firstName;
    dto.lastName = admin.lastName;
    return dto;
  }
}
