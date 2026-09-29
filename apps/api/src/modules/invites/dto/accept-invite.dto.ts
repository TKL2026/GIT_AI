import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AcceptInviteDto {
  @ApiProperty({ example: 'Awa' })
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty({ example: 'Diallo' })
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password!: string;
}
