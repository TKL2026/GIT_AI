import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, SubscriptionStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthenticatedPlatformAdmin } from "../../common/types/authenticated-platform-admin.interface";
import { AdminAuditLogService } from "./admin-audit-log.service";
import { AdminOrganizationsQueryDto } from "./dto/admin-organizations-query.dto";

export interface AdminOrganizationListItem {
  id: string;
  name: string;
  country: string | null;
  industry: string | null;
  userCount: number;
  planCode: string | null;
  planName: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  suspended: boolean;
  createdAt: Date;
}

export interface AdminOrganizationDetail {
  id: string;
  name: string;
  country: string | null;
  industry: string | null;
  teamSize: string | null;
  createdAt: Date;
  onboardingStep: string | null;
  onboardingCompletedAt: Date | null;
  suspended: boolean;
  suspendedAt: Date | null;
  planCode: string | null;
  planName: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  currentPeriodEnd: Date | null;
  userCount: number;
  productCount: number;
  salesCount: number;
  lastSaleAt: Date | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AdminOrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AdminAuditLogService,
  ) {}

  async list(
    query: AdminOrganizationsQueryDto,
  ): Promise<{ data: AdminOrganizationListItem[]; total: number }> {
    const { page, pageSize, search, status, planCode } = query;

    const subscriptionFilter: Prisma.SubscriptionWhereInput = {};
    if (status) subscriptionFilter.status = status;
    if (planCode) subscriptionFilter.plan = { code: planCode };

    const where: Prisma.OrganizationWhereInput = {
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(Object.keys(subscriptionFilter).length
        ? { subscription: subscriptionFilter }
        : {}),
    };

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          subscription: { include: { plan: true } },
          _count: { select: { users: true } },
        },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return {
      total,
      data: organizations.map((org) => ({
        id: org.id,
        name: org.name,
        country: org.country,
        industry: org.industry,
        userCount: org._count.users,
        planCode: org.subscription?.plan?.code ?? null,
        planName: org.subscription?.plan?.name ?? null,
        subscriptionStatus: org.subscription?.status ?? null,
        suspended: Boolean(org.suspendedAt),
        createdAt: org.createdAt,
      })),
    };
  }

  async getDetail(id: string): Promise<AdminOrganizationDetail> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        subscription: { include: { plan: true } },
        _count: { select: { users: true, products: true, sales: true } },
      },
    });
    if (!organization) {
      throw new NotFoundException("Organisation introuvable.");
    }

    const lastSale = await this.prisma.sale.findFirst({
      where: { organizationId: id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    return {
      id: organization.id,
      name: organization.name,
      country: organization.country,
      industry: organization.industry,
      teamSize: organization.teamSize,
      createdAt: organization.createdAt,
      onboardingStep: organization.onboardingStep,
      onboardingCompletedAt: organization.onboardingCompletedAt,
      suspended: Boolean(organization.suspendedAt),
      suspendedAt: organization.suspendedAt,
      planCode: organization.subscription?.plan?.code ?? null,
      planName: organization.subscription?.plan?.name ?? null,
      subscriptionStatus: organization.subscription?.status ?? null,
      currentPeriodEnd: organization.subscription?.currentPeriodEnd ?? null,
      userCount: organization._count.users,
      productCount: organization._count.products,
      salesCount: organization._count.sales,
      lastSaleAt: lastSale?.createdAt ?? null,
    };
  }

  async suspend(
    id: string,
    performedBy: AuthenticatedPlatformAdmin,
  ): Promise<void> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });
    if (!organization) throw new NotFoundException("Organisation introuvable.");
    if (organization.suspendedAt)
      throw new ConflictException("Cette organisation est déjà suspendue.");

    await this.prisma.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id },
        data: { suspendedAt: new Date() },
      });
      await this.auditLogService.record(
        {
          platformAdminId: performedBy.platformAdminId,
          action: "organization.suspend",
          targetType: "organization",
          targetId: id,
        },
        tx,
      );
    });
  }

  async reactivate(
    id: string,
    performedBy: AuthenticatedPlatformAdmin,
  ): Promise<void> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });
    if (!organization) throw new NotFoundException("Organisation introuvable.");
    if (!organization.suspendedAt)
      throw new ConflictException("Cette organisation n'est pas suspendue.");

    await this.prisma.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id },
        data: { suspendedAt: null },
      });
      await this.auditLogService.record(
        {
          platformAdminId: performedBy.platformAdminId,
          action: "organization.reactivate",
          targetType: "organization",
          targetId: id,
        },
        tx,
      );
    });
  }

  async extendTrial(
    id: string,
    days: number,
    performedBy: AuthenticatedPlatformAdmin,
  ): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId: id },
    });
    if (!subscription) {
      throw new NotFoundException("Aucun abonnement pour cette organisation.");
    }
    if (
      subscription.status !== "TRIAL" &&
      subscription.status !== "TRIAL_EXPIRED"
    ) {
      throw new ConflictException(
        "L'extension d'essai n'est possible que pour un essai en cours ou expiré.",
      );
    }

    const now = new Date();
    const base =
      subscription.currentPeriodEnd && subscription.currentPeriodEnd > now
        ? subscription.currentPeriodEnd
        : now;
    const newPeriodEnd = new Date(base.getTime() + days * DAY_MS);

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { organizationId: id },
        data: { status: "TRIAL", currentPeriodEnd: newPeriodEnd },
      });
      await this.auditLogService.record(
        {
          platformAdminId: performedBy.platformAdminId,
          action: "organization.extend_trial",
          targetType: "organization",
          targetId: id,
          metadata: { days, newPeriodEnd: newPeriodEnd.toISOString() },
        },
        tx,
      );
    });
  }

  /** Journalise une simple consultation de fiche organisation (section 14 :
   * "consultation d'une organisation si jugé nécessaire") — utile pour le
   * support, volontairement pas posé sur la liste (trop bruyant). */
  async recordView(
    id: string,
    performedBy: AuthenticatedPlatformAdmin,
  ): Promise<void> {
    await this.auditLogService.record({
      platformAdminId: performedBy.platformAdminId,
      action: "organization.view",
      targetType: "organization",
      targetId: id,
    });
  }
}
