import { ApiProperty } from "@nestjs/swagger";
import { PlatformAdminResponseDto } from "./platform-admin-response.dto";

export class AdminAuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ type: PlatformAdminResponseDto })
  admin!: PlatformAdminResponseDto;
}
