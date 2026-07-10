import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FinanceSummaryResponseDto } from './dto/finance-summary-response.dto';
import { ProductProfitabilityResponseDto } from './dto/product-profitability-response.dto';

function buildDateFilter(from?: string, to?: string): { gte?: Date; lte?: Date } | undefined {
  if (!from && !to) {
    return undefined;
  }
  return {
    ...(from ? { gte: new Date(from) } : {}),
    ...(to ? { lte: new Date(to) } : {}),
  };
}

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(organizationId: string, from?: string, to?: string): Promise<FinanceSummaryResponseDto> {
    const dateFilter = buildDateFilter(from, to);

    const sales = await this.prisma.sale.findMany({
      where: { organizationId, ...(dateFilter ? { createdAt: dateFilter } : {}) },
    });
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

    const expenses = await this.prisma.expense.findMany({
      where: { organizationId, ...(dateFilter ? { expenseDate: dateFilter } : {}) },
    });
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    const saleItems = await this.prisma.saleItem.findMany({
      where: { sale: { organizationId, ...(dateFilter ? { createdAt: dateFilter } : {}) } },
      include: { product: true },
    });
    const totalCogs = saleItems.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.purchasePrice),
      0,
    );

    const grossMargin = totalRevenue - totalCogs;
    const netProfit = grossMargin - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      totalCogs,
      grossMargin,
      netProfit,
      salesCount: sales.length,
    };
  }

  async getProductsProfitability(
    organizationId: string,
    from?: string,
    to?: string,
  ): Promise<ProductProfitabilityResponseDto[]> {
    const dateFilter = buildDateFilter(from, to);

    const saleItems = await this.prisma.saleItem.findMany({
      where: { sale: { organizationId, ...(dateFilter ? { createdAt: dateFilter } : {}) } },
      include: { product: true },
    });

    const grouped = new Map<
      string,
      { productId: string; productName: string; quantitySold: number; totalRevenue: number; purchasePrice: number }
    >();

    for (const item of saleItems) {
      const lineTotal = Number(item.lineTotal);
      const existing = grouped.get(item.productId);
      if (existing) {
        existing.quantitySold += item.quantity;
        existing.totalRevenue += lineTotal;
      } else {
        grouped.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          quantitySold: item.quantity,
          totalRevenue: lineTotal,
          purchasePrice: Number(item.product.purchasePrice),
        });
      }
    }

    return Array.from(grouped.values())
      .map((entry) => {
        const estimatedCost = entry.quantitySold * entry.purchasePrice;
        return {
          productId: entry.productId,
          productName: entry.productName,
          quantitySold: entry.quantitySold,
          totalRevenue: entry.totalRevenue,
          estimatedCost,
          estimatedMargin: entry.totalRevenue - estimatedCost,
        };
      })
      .sort((a, b) => b.estimatedMargin - a.estimatedMargin);
  }
}
