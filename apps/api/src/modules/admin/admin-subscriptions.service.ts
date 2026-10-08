import { Injectable } from "@nestjs/common";
import { Prisma, SubscriptionStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminSubscriptionsQueryDto } from "./dto/admin-subscriptions-query.dto";

export interface AdminSubscriptionListItem {
  id: string;
  organizationId: string;
  organizationName: string;
  planCode: string | null;
  planName: string | null;
  status: SubscriptionStatus;
  startedAt: Date | null;
  currentPeriodEnd: Date | null;
  createdAt: Date;
}

@Injectable()
export class AdminSubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: AdminSubscriptionsQueryDto,
  ): Promise<{ data: AdminSubscriptionListItem[]; total: number }> {
    const { page, pageSize, search, status, planCode } = query;

    const where: Prisma.SubscriptionWhereInput = {
      ...(status ? { status } : {}),
      ...(planCode ? { plan: { code: planCode } } : {}),
      ...(search
        ? { organization: { name: { contains: search, mode: "insensitive" } } }
        : {}),
    };

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { organization: { select: { name: true } }, plan: true },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      total,
      data: subscriptions.map((sub) => ({
        id: sub.id,
        organizationId: sub.organizationId,
        organizationName: sub.organization.name,
        planCode: sub.plan?.code ?? null,
        planName: sub.plan?.name ?? null,
        status: sub.status,
        startedAt: sub.startedAt,
        currentPeriodEnd: sub.currentPeriodEnd,
        createdAt: sub.createdAt,
      })),
    };
  }
}
