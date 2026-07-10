import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductThresholdsDto } from './dto/update-product-thresholds.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { organizationId },
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
}
