import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus, Supplier } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { StockService } from '../stock/stock.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';

type PurchaseOrderWithDetails = PurchaseOrder & { items: PurchaseOrderItem[]; supplier: Supplier };

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly suppliersService: SuppliersService,
    private readonly stockService: StockService,
  ) {}

  async create(
    organizationId: string,
    performedByUserId: string,
    dto: CreatePurchaseOrderDto,
  ): Promise<PurchaseOrderWithDetails> {
    await this.suppliersService.findOne(organizationId, dto.supplierId);

    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const itemsData: {
        productId: string;
        productName: string;
        quantity: number;
        unitCost: number;
        lineTotal: number;
      }[] = [];

      for (const item of dto.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, organizationId },
        });
        if (!product) {
          throw new NotFoundException(`Produit ${item.productId} introuvable.`);
        }

        const lineTotal = item.unitCost * item.quantity;
        totalAmount += lineTotal;

        itemsData.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitCost: item.unitCost,
          lineTotal,
        });
      }

      return tx.purchaseOrder.create({
        data: {
          organizationId,
          supplierId: dto.supplierId,
          performedByUserId,
          status: PurchaseOrderStatus.PENDING,
          totalAmount,
          items: { create: itemsData },
        },
        include: { items: true, supplier: true },
      });
    });
  }

  async receive(
    organizationId: string,
    performedByUserId: string,
    id: string,
  ): Promise<PurchaseOrderWithDetails> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findFirst({
        where: { id, organizationId },
        include: { items: true, supplier: true },
      });
      if (!order) {
        throw new NotFoundException('Commande introuvable.');
      }
      if (order.status !== PurchaseOrderStatus.PENDING) {
        throw new BadRequestException('Cette commande a déjà été reçue ou annulée.');
      }

      for (const item of order.items) {
        await this.stockService.incrementStockInTransaction(tx, {
          organizationId,
          productId: item.productId,
          quantity: item.quantity,
          performedByUserId,
          reason: `Réception commande ${order.id}`,
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { purchasePrice: item.unitCost },
        });
      }

      return tx.purchaseOrder.update({
        where: { id: order.id },
        data: { status: PurchaseOrderStatus.RECEIVED, receivedAt: new Date() },
        include: { items: true, supplier: true },
      });
    });
  }

  async cancel(organizationId: string, id: string): Promise<PurchaseOrderWithDetails> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findFirst({
        where: { id, organizationId },
        include: { items: true, supplier: true },
      });
      if (!order) {
        throw new NotFoundException('Commande introuvable.');
      }
      if (order.status !== PurchaseOrderStatus.PENDING) {
        throw new BadRequestException('Seule une commande en attente peut être annulée.');
      }

      return tx.purchaseOrder.update({
        where: { id: order.id },
        data: { status: PurchaseOrderStatus.CANCELLED },
        include: { items: true, supplier: true },
      });
    });
  }

  findAll(organizationId: string): Promise<PurchaseOrderWithDetails[]> {
    return this.prisma.purchaseOrder.findMany({
      where: { organizationId },
      include: { items: true, supplier: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string): Promise<PurchaseOrderWithDetails> {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      include: { items: true, supplier: true },
    });
    if (!order) {
      throw new NotFoundException('Commande introuvable.');
    }
    return order;
  }
}
