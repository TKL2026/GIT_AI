import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Product, StockMovement, StockMovementType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { StockInDto } from './dto/stock-in.dto';
import { StockOutDto } from './dto/stock-out.dto';

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

  async recordOut(
    organizationId: string,
    performedByUserId: string,
    dto: StockOutDto,
  ): Promise<StockMovement> {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.product.updateMany({
        where: {
          id: dto.productId,
          organizationId,
          stockQuantity: { gte: dto.quantity },
        },
        data: { stockQuantity: { decrement: dto.quantity } },
      });

      if (result.count === 0) {
        const product = await tx.product.findFirst({
          where: { id: dto.productId, organizationId },
        });
        if (!product) {
          throw new NotFoundException('Produit introuvable.');
        }
        throw new BadRequestException('Stock insuffisant pour cette sortie.');
      }

      const updated = await tx.product.findFirstOrThrow({
        where: { id: dto.productId, organizationId },
      });

      return tx.stockMovement.create({
        data: {
          organizationId,
          productId: dto.productId,
          performedByUserId,
          type: StockMovementType.OUT,
          quantity: dto.quantity,
          previousQuantity: updated.stockQuantity + dto.quantity,
          newQuantity: updated.stockQuantity,
          reason: dto.reason,
        },
      });
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
