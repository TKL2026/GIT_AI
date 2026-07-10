import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expense, ExpenseCategory } from '@prisma/client';

export class ExpenseResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  performedByUserId!: string;

  @ApiProperty({ enum: ExpenseCategory })
  category!: ExpenseCategory;

  @ApiPropertyOptional()
  description!: string | null;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  expenseDate!: Date;

  @ApiProperty()
  createdAt!: Date;

  static fromEntity(expense: Expense): ExpenseResponseDto {
    const dto = new ExpenseResponseDto();
    dto.id = expense.id;
    dto.organizationId = expense.organizationId;
    dto.performedByUserId = expense.performedByUserId;
    dto.category = expense.category;
    dto.description = expense.description;
    dto.amount = Number(expense.amount);
    dto.expenseDate = expense.expenseDate;
    dto.createdAt = expense.createdAt;
    return dto;
  }
}
