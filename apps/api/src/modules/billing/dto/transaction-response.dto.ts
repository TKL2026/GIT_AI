import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MobileMoneyOperator,
  PaymentProvider,
  PaymentTransaction,
  PaymentTransactionStatus,
} from '@prisma/client';

export class TransactionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  planId!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ enum: PaymentProvider })
  provider!: PaymentProvider;

  @ApiProperty({ enum: MobileMoneyOperator })
  operator!: MobileMoneyOperator;

  @ApiProperty()
  phoneNumber!: string;

  @ApiProperty({ enum: PaymentTransactionStatus })
  status!: PaymentTransactionStatus;

  @ApiProperty()
  externalReference!: string;

  @ApiPropertyOptional({ nullable: true })
  providerReference!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  paidAt!: Date | null;

  static fromEntity(transaction: PaymentTransaction): TransactionResponseDto {
    const dto = new TransactionResponseDto();
    dto.id = transaction.id;
    dto.planId = transaction.planId;
    dto.amount = transaction.amount;
    dto.currency = transaction.currency;
    dto.provider = transaction.provider;
    dto.operator = transaction.operator;
    dto.phoneNumber = transaction.phoneNumber;
    dto.status = transaction.status;
    dto.externalReference = transaction.externalReference;
    dto.providerReference = transaction.providerReference;
    dto.createdAt = transaction.createdAt;
    dto.paidAt = transaction.paidAt;
    return dto;
  }
}
