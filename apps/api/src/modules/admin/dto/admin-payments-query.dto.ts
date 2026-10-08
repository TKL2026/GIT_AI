import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";
import { PaymentTransactionStatus } from "@prisma/client";
import { PaginationQueryDto } from "./pagination-query.dto";

const PAYMENT_STATUSES = Object.values(PaymentTransactionStatus);

export class AdminPaymentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PAYMENT_STATUSES })
  @IsOptional()
  @IsIn(PAYMENT_STATUSES)
  status?: PaymentTransactionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;
}
