import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Product, StockMovement, StockMovementType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { StockInDto } from './dto/stock-in.dto';
import { StockOutDto } from './dto/stock-out.dto';

interface DecrementStockParams {
  organizationId: string;
  productId: string;
  quantity: number;
  performedByUserId: string;
  reason?: string;
}

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async recordIn(
    organizationId: string,
    performedByUserId: string,
    dto: StockInDto,
  ): Promise<StockMovement> {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: dto.productId, organizationId },
      });
      if (!product) {
        throw new NotFoundException('Produit introuvable.');
      }

      const updated = await tx.product.update({
        where: { id: product.id },
        data: { stockQuantity: { increment: dto.quantity } },
      });

      return tx.stockMovement.create({
        data: {
          organizationId,
          productId: product.id,
          performedByUserId,
          type: StockMovementType.IN,
          quantity: dto.quantity,
          previousQuantity: product.stockQuantity,
          newQuantity: updated.stockQuantity,
          reason: dto.reason,
        },
      });
    });
  }

  /**
   * Décrémente le stock de manière atomique (garde `gte` côté DB, pas de
   * read-then-write) et enregistre le mouvement correspondant. Accepte un
   * `tx` externe pour pouvoir être appelée depuis la transaction d'un autre
   * module (ex: SalesService) et échouer/réussir avec elle.
   */
  async decrementStockInTransaction(
    tx: Prisma.TransactionClient,
    params: DecrementStockParams,
  ): Promise<{ product: Product; movement: StockMovement }> {
    const { organizationId, productId, quantity, performedByUserId, reason } = params;

    const result = await tx.product.updateMany({
      where: {
        id: productId,
        organizationId,
        stockQuantity: { gte: quantity },
      },
      data: { stockQuantity: { decrement: quantity } },
    });

    if (result.count === 0) {
      const product = await tx.product.findFirst({
        where: { id: productId, organizationId },
      });
      if (!product) {
        throw new NotFoundException('Produit introuvable.');
      }
      throw new BadRequestException(`Stock insuffisant pour ${product.name}.`);
    }

    const product = await tx.product.findFirstOrThrow({
      where: { id: productId, organizationId },
    });

    const movement = await tx.stockMovement.create({
      data: {
        organizationId,
        productId,
        performedByUserId,
        type: StockMovementType.OUT,
        quantity,
        previousQuantity: product.stockQuantity + quantity,
        newQuantity: product.stockQuantity,
        reason,
      },
    });

    return { product, movement };
  }

  async recordOut(
    organizationId: string,
    performedByUserId: string,
    dto: StockOutDto,
  ): Promise<StockMovement> {
    return this.prisma.$transaction(async (tx) => {
      const { movement } = await this.decrementStockInTransaction(tx, {
        organizationId,
        productId: dto.productId,
        quantity: dto.quantity,
        performedByUserId,
        reason: dto.reason,
      });
      return movement;
    });
  }

  async recordAdjustment(
    organizationId: string,
    performedByUserId: string,
    dto: StockAdjustmentDto,
  ): Promise<StockMovement> {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: dto.productId, organizationId },
      });
      if (!product) {
        throw new NotFoundException('Produit introuvable.');
      }

      const delta = dto.newQuantity - product.stockQuantity;

      await tx.product.update({
        where: { id: product.id },
        data: { stockQuantity: dto.newQuantity },
      });

      return tx.stockMovement.create({
        data: {
          organizationId,
          productId: product.id,
          performedByUserId,
          type: StockMovementType.ADJUSTMENT,
          quantity: delta,
          previousQuantity: product.stockQuantity,
          newQuantity: dto.newQuantity,
          reason: dto.reason,
        },
      });
    });
  }

  findMovements(organizationId: string, productId?: string): Promise<StockMovement[]> {
    return this.prisma.stockMovement.findMany({
      where: { organizationId, ...(productId ? { productId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  findLevels(organizationId: string): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async findAlerts(organizationId: string): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: { organizationId, minStock: { not: null } },
      orderBy: { name: 'asc' },
    });
    return products.filter((product) => product.stockQuantity <= (product.minStock ?? 0));
  }
}
