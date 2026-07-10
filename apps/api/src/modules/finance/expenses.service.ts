import { Injectable, NotFoundException } from '@nestjs/common';
import { Expense } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  create(organizationId: string, performedByUserId: string, dto: CreateExpenseDto): Promise<Expense> {
    return this.prisma.expense.create({
      data: {
        organizationId,
        performedByUserId,
        category: dto.category,
        description: dto.description,
        amount: dto.amount,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
      },
    });
  }

  findAll(organizationId: string, from?: string, to?: string): Promise<Expense[]> {
    return this.prisma.expense.findMany({
      where: {
        organizationId,
        ...(from || to
          ? {
              expenseDate: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { expenseDate: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string): Promise<Expense> {
    const expense = await this.prisma.expense.findFirst({
      where: { id, organizationId },
    });
    if (!expense) {
      throw new NotFoundException('Dépense introuvable.');
    }
    return expense;
  }
}
