import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Boutique Demo' })
  @IsString()
  @MinLength(2)
  organizationName!: string;

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
