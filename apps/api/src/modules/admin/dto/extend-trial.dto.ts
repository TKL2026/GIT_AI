import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Max, Min } from "class-validator";

export class ExtendTrialDto {
  @ApiProperty({ example: 7, minimum: 1, maximum: 30 })
  @IsInt()
  @Min(1)
  @Max(30)
  days!: number;
}
