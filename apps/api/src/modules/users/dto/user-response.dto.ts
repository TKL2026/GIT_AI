import { ApiProperty } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  createdAt!: Date;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.role = user.role;
    dto.organizationId = user.organizationId;
    dto.createdAt = user.createdAt;
    return dto;
  }
}
