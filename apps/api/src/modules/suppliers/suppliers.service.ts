import { Injectable, NotFoundException } from '@nestjs/common';
import { Supplier } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string): Promise<Supplier[]> {
    return this.prisma.supplier.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(organizationId: string, id: string): Promise<Supplier> {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, organizationId },
    });
    if (!supplier) {
      throw new NotFoundException('Fournisseur introuvable.');
    }
    return supplier;
  }

  create(organizationId: string, dto: CreateSupplierDto): Promise<Supplier> {
    return this.prisma.supplier.create({
      data: {
        organizationId,
        name: dto.name,
        contactName: dto.contactName,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
      },
    });
  }

  async update(organizationId: string, id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    await this.findOne(organizationId, id);

    return this.prisma.supplier.update({
      where: { id },
      data: {
        name: dto.name,
        contactName: dto.contactName,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
      },
    });
  }
}
