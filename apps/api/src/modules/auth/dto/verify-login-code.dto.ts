import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";

export class VerifyLoginCodeDto {
  @ApiProperty()
  @IsString()
  challengeToken!: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @Matches(/^\d{6}$/, { message: "Le code doit contenir exactement 6 chiffres." })
  code!: string;
}
