import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductThresholdsDto } from './dto/update-product-thresholds.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Masque les produits archivés (BUG-004) : un produit désactivé ne doit
   * plus apparaître dans le catalogue ni être sélectionnable pour une
   * vente/un achat. `findOne` reste volontairement non filtré pour que la
   * fiche détail d'un produit déjà archivé reste consultable.
   */
  findAll(organizationId: string): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { organizationId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: { id, organizationId },
    });
    if (!product) {
      throw new NotFoundException('Produit introuvable.');
    }
    return product;
  }

  async create(organizationId: string, dto: CreateProductDto): Promise<Product> {
    const existing = await this.prisma.product.findUnique({
      where: { organizationId_sku: { organizationId, sku: dto.sku } },
    });
    if (existing) {
      throw new ConflictException('Un produit avec ce SKU existe déjà.');
    }

    return this.prisma.product.create({
      data: {
        organizationId,
        name: dto.name,
        sku: dto.sku,
        purchasePrice: dto.purchasePrice,
        salePrice: dto.salePrice,
        stockQuantity: dto.initialStock ?? 0,
        minStock: dto.minStock,
        maxStock: dto.maxStock,
      },
    });
  }

  async updateThresholds(
    organizationId: string,
    id: string,
    dto: UpdateProductThresholdsDto,
  ): Promise<Product> {
    await this.findOne(organizationId, id);

    return this.prisma.product.update({
      where: { id },
      data: {
        minStock: dto.minStock,
        maxStock: dto.maxStock,
      },
    });
  }

  async update(organizationId: string, id: string, dto: UpdateProductDto): Promise<Product> {
    await this.findOne(organizationId, id);

    if (dto.sku) {
      const existing = await this.prisma.product.findUnique({
        where: { organizationId_sku: { organizationId, sku: dto.sku } },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Un produit avec ce SKU existe déjà.');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        sku: dto.sku,
        purchasePrice: dto.purchasePrice,
        salePrice: dto.salePrice,
        minStock: dto.minStock,
        maxStock: dto.maxStock,
      },
    });
  }

  /**
   * Archivage (BUG-004) : pas de suppression physique, impossible de toute
   * façon pour un produit déjà vendu (SaleItem.product est onDelete:
   * Restrict) — et surtout destructeur pour l'historique financier.
   */
  async archive(organizationId: string, id: string): Promise<Product> {
    await this.findOne(organizationId, id);

    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
