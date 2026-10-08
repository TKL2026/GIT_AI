import { Injectable, NotFoundException } from '@nestjs/common';
import { Sale, SaleItem } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StockService } from '../stock/stock.service';
import { CreateSaleDto } from './dto/create-sale.dto';

type SaleWithItems = Sale & { items: SaleItem[] };

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
  ) {}

  async create(
    organizationId: string,
    performedByUserId: string,
    dto: CreateSaleDto,
  ): Promise<SaleWithItems> {
    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const itemsData: {
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        unitCost: number;
        lineTotal: number;
      }[] = [];

      for (const item of dto.items) {
        const { product } = await this.stockService.decrementStockInTransaction(tx, {
          organizationId,
          productId: item.productId,
          quantity: item.quantity,
          performedByUserId,
          reason: 'Vente',
        });

        const unitPrice = Number(product.salePrice);
        const lineTotal = unitPrice * item.quantity;
        totalAmount += lineTotal;

        itemsData.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice,
          // Coût figé au moment de la vente (BUG-006) : une réception
          // ultérieure à un prix différent ne doit jamais rouvrir le COGS
          // de cette vente déjà conclue.
          unitCost: Number(product.purchasePrice),
          lineTotal,
        });
      }

      return tx.sale.create({
        data: {
          organizationId,
          performedByUserId,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          paymentMethod: dto.paymentMethod,
          totalAmount,
          items: { create: itemsData },
        },
        include: { items: true },
      });
    });
  }

  findAll(organizationId: string): Promise<SaleWithItems[]> {
    return this.prisma.sale.findMany({
      where: { organizationId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string): Promise<SaleWithItems> {
    const sale = await this.prisma.sale.findFirst({
      where: { id, organizationId },
      include: { items: true },
    });
    if (!sale) {
      throw new NotFoundException('Vente introuvable.');
    }
    return sale;
  }
}
