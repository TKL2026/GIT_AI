import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";
import { SubscriptionStatus } from "@prisma/client";
import { PaginationQueryDto } from "./pagination-query.dto";

const SUBSCRIPTION_STATUSES = Object.values(SubscriptionStatus);

export class AdminOrganizationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: SUBSCRIPTION_STATUSES })
  @IsOptional()
  @IsIn(SUBSCRIPTION_STATUSES)
  status?: SubscriptionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planCode?: string;
}
