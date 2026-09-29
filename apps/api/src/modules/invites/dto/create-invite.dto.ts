import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsEnum } from 'class-validator';

export class CreateInviteDto {
  @ApiProperty({ example: 'collegue@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: Role, example: Role.CASHIER })
  @IsEnum(Role)
  role!: Role;
}
