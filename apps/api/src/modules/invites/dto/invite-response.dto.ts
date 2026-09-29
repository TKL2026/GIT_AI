import { ApiProperty } from '@nestjs/swagger';
import { PendingInvite, Role } from '@prisma/client';

export class InviteResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiProperty()
  token!: string;

  @ApiProperty()
  expiresAt!: Date;

  @ApiProperty({ nullable: true })
  acceptedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  static fromEntity(invite: PendingInvite): InviteResponseDto {
    const dto = new InviteResponseDto();
    dto.id = invite.id;
    dto.email = invite.email;
    dto.role = invite.role;
    dto.token = invite.token;
    dto.expiresAt = invite.expiresAt;
    dto.acceptedAt = invite.acceptedAt;
    dto.createdAt = invite.createdAt;
    return dto;
  }
}
