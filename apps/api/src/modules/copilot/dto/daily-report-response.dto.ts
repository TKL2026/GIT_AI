import { ApiProperty } from '@nestjs/swagger';

export class DailyReportResponseDto {
  @ApiProperty()
  report!: string;
}
