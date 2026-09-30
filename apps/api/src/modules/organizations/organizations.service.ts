import { Injectable } from '@nestjs/common';
import { Organization, Subscription } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

export type OrganizationWithSubscription = Organization & { subscription: Subscription | null };

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<OrganizationWithSubscription | null> {
    return this.prisma.organization.findUnique({ where: { id }, include: { subscription: true } });
  }

  create(name: string): Promise<Organization> {
    return this.prisma.organization.create({ data: { name } });
  }

  update(id: string, dto: UpdateOrganizationDto): Promise<OrganizationWithSubscription> {
    return this.prisma.organization.update({ where: { id }, data: dto, include: { subscription: true } });
  }

  completeOnboarding(id: string): Promise<OrganizationWithSubscription> {
    return this.prisma.organization.update({
      where: { id },
      data: { onboardingStep: 'done', onboardingCompletedAt: new Date() },
      include: { subscription: true },
    });
  }
}
